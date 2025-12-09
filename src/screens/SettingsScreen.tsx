import React, { useState, useContext, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Text, TextInput, Button, Switch, List, Avatar, useTheme, Divider, Portal, Dialog, SegmentedButtons, ActivityIndicator } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { api } from "../services/api";

export default function SettingsScreen({ navigation }: any) {
    const theme = useTheme();
    const { user, signOut, updateUserProfile } = useContext(AuthContext);
    const { isDark, toggleTheme } = useContext(ThemeContext);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [bio, setBio] = useState("");
    const [website, setWebsite] = useState("");

    const [notifyLists, setNotifyLists] = useState(true);
    const [notifyReviews, setNotifyReviews] = useState(true);
    const [notifyFollowers, setNotifyFollowers] = useState(true);
    const [notifyReleases, setNotifyReleases] = useState(true);

    const [profileVisibility, setProfileVisibility] = useState("all");
    const [showActivity, setShowActivity] = useState(true);
    const [showReviews, setShowReviews] = useState(true);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [profileRes, prefsRes] = await Promise.all([
                api.get("/user/profile"),
                api.get("/user/preferences")
            ]);

            const profile = profileRes.data;
            const prefs = prefsRes.data;

            setBio(profile.bio || "");
            setWebsite(profile.website || "");

            setNotifyLists(prefs.notify_lists);
            setNotifyReviews(prefs.notify_reviews);
            setNotifyFollowers(prefs.notify_followers);
            setNotifyReleases(prefs.notify_releases);
            setProfileVisibility(prefs.profile_visibility);
            setShowActivity(prefs.show_recent_activity);
            setShowReviews(prefs.show_reviews);

        } catch (error) {
            console.log("Erro ao carregar configurações (mock ou endpoint inexistente)");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await api.put("/user/profile", {
                name,
                username,
                bio,
                website
            });
            await updateUserProfile();
            Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
        } catch (error) {
            Alert.alert("Erro", "Não foi possível atualizar o perfil.");
        } finally {
            setSaving(false);
        }
    };

    const handleSavePreferences = async () => {
        setSaving(true);
        try {
            await api.put("/user/preferences", {
                notify_lists: notifyLists,
                notify_reviews: notifyReviews,
                notify_followers: notifyFollowers,
                notify_releases: notifyReleases,
                profile_visibility: profileVisibility,
                show_recent_activity: showActivity,
                show_reviews: showReviews
            });
            Alert.alert("Sucesso", "Preferências salvas.");
        } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar as preferências.");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert("Erro", "As senhas não conferem.");
            return;
        }
        setSaving(true);
        try {
            await api.put("/user/password", {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword
            });
            Alert.alert("Sucesso", "Senha alterada.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            Alert.alert("Erro", "Falha ao alterar senha. Verifique a senha atual.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteDialogVisible(false);
        setSaving(true);
        try {
            await api.delete("/user/account");
            await signOut();
        } catch (error) {
            Alert.alert("Erro", "Não foi possível excluir a conta.");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => Alert.alert("Editar Foto", "Funcionalidade em breve.")}>
                        {user?.avatar ? (
                            <Avatar.Image size={80} source={{ uri: user.avatar }} />
                        ) : (
                            <Avatar.Text size={80} label={user?.name?.charAt(0) || "U"} style={{ backgroundColor: theme.colors.primary }} />
                        )}
                        <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                            <Text style={{ color: 'white', fontSize: 10 }}>Editar</Text>
                        </View>
                    </TouchableOpacity>
                    <Text variant="titleLarge" style={{ marginTop: 12, fontWeight: 'bold', color: theme.colors.onBackground }}>{user?.name}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>@{user?.username}</Text>
                </View>

                <List.AccordionGroup>

                    <List.Accordion title="Perfil" id="1" left={props => <List.Icon {...props} icon="account" />}>
                        <View style={styles.accordionContent}>
                            <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" style={styles.input} dense />
                            <TextInput label="Usuário" value={username} onChangeText={setUsername} mode="outlined" style={styles.input} dense autoCapitalize="none" />
                            <TextInput label="Bio" value={bio} onChangeText={setBio} mode="outlined" style={styles.input} multiline numberOfLines={3} />
                            <TextInput label="Website" value={website} onChangeText={setWebsite} mode="outlined" style={styles.input} dense autoCapitalize="none" keyboardType="url" />
                            <Button mode="contained" onPress={handleSaveProfile} loading={saving} style={styles.saveButton}>Salvar Perfil</Button>
                        </View>
                    </List.Accordion>

                    <Divider />

                    <List.Accordion title="Notificações" id="2" left={props => <List.Icon {...props} icon="bell" />}>
                        <View style={styles.accordionContent}>
                            <View style={styles.switchRow}>
                                <Text style={{ color: theme.colors.onSurface }}>Listas</Text>
                                <Switch value={notifyLists} onValueChange={setNotifyLists} />
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={{ color: theme.colors.onSurface }}>Reviews</Text>
                                <Switch value={notifyReviews} onValueChange={setNotifyReviews} />
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={{ color: theme.colors.onSurface }}>Novos Seguidores</Text>
                                <Switch value={notifyFollowers} onValueChange={setNotifyFollowers} />
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={{ color: theme.colors.onSurface }}>Lançamentos</Text>
                                <Switch value={notifyReleases} onValueChange={setNotifyReleases} />
                            </View>
                            <Button mode="contained" onPress={handleSavePreferences} loading={saving} style={styles.saveButton}>Salvar Preferências</Button>
                        </View>
                    </List.Accordion>

                    <Divider />

                    <List.Accordion title="Aparência" id="3" left={props => <List.Icon {...props} icon="theme-light-dark" />}>
                        <View style={styles.accordionContent}>
                            <Text style={{ marginBottom: 12, color: theme.colors.onSurface }}>Tema do Aplicativo</Text>
                            <SegmentedButtons
                                value={isDark ? 'dark' : 'light'}
                                onValueChange={(val) => {
                                    if ((val === 'dark' && !isDark) || (val === 'light' && isDark)) {
                                        toggleTheme();
                                    }
                                }}
                                buttons={[
                                    { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
                                    { value: 'dark', label: 'Escuro', icon: 'weather-night' },
                                ]}
                            />
                        </View>
                    </List.Accordion>

                    <Divider />

                    <List.Accordion title="Privacidade" id="4" left={props => <List.Icon {...props} icon="shield-account" />}>
                        <View style={styles.accordionContent}>
                            <Text style={{ marginBottom: 8, color: theme.colors.onSurface }}>Quem pode ver meu perfil:</Text>
                            <SegmentedButtons
                                value={profileVisibility}
                                onValueChange={setProfileVisibility}
                                buttons={[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'followers', label: 'Seguidores' },
                                    { value: 'none', label: 'Ninguém' },
                                ]}
                                style={{ marginBottom: 16 }}
                            />
                            <View style={styles.switchRow}>
                                <Text style={{ color: theme.colors.onSurface }}>Mostrar atividade recente</Text>
                                <Switch value={showActivity} onValueChange={setShowActivity} />
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={{ color: theme.colors.onSurface }}>Mostrar avaliações</Text>
                                <Switch value={showReviews} onValueChange={setShowReviews} />
                            </View>
                            <Button mode="contained" onPress={handleSavePreferences} loading={saving} style={styles.saveButton}>Salvar Privacidade</Button>
                        </View>
                    </List.Accordion>

                    <Divider />

                    <List.Accordion title="Conta e Segurança" id="5" left={props => <List.Icon {...props} icon="lock" />}>
                        <View style={styles.accordionContent}>
                            <TextInput label="Email" value={user?.email} disabled mode="outlined" style={[styles.input, { opacity: 0.6 }]} dense />

                            <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>Alterar Senha</Text>
                            <TextInput label="Senha Atual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry mode="outlined" style={styles.input} dense />
                            <TextInput label="Nova Senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry mode="outlined" style={styles.input} dense />
                            <TextInput label="Confirmar Nova Senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry mode="outlined" style={styles.input} dense />

                            <Button mode="outlined" onPress={handleChangePassword} loading={saving} style={styles.saveButton}>Atualizar Senha</Button>

                            <Divider style={{ marginVertical: 20 }} />

                            <Button
                                mode="contained"
                                buttonColor={theme.colors.error}
                                onPress={() => setDeleteDialogVisible(true)}
                                icon="delete"
                            >
                                Excluir Conta
                            </Button>
                        </View>
                    </List.Accordion>

                </List.AccordionGroup>

                <View style={styles.footer}>
                    <Button mode="outlined" onPress={signOut} icon="logout" textColor={theme.colors.error} style={{ borderColor: theme.colors.error }}>
                        Sair da Conta
                    </Button>
                    <Text style={{ textAlign: 'center', marginTop: 16, color: theme.colors.secondary, fontSize: 12 }}>WikiNerd v1.0.0</Text>
                </View>

            </ScrollView>

            <Portal>
                <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
                    <Dialog.Title style={{ color: theme.colors.onSurface }}>Excluir Conta?</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            Esta ação é irreversível. Todos os seus dados, listas e avaliações serão perdidos permanentemente.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
                        <Button onPress={handleDeleteAccount} textColor={theme.colors.error}>Excluir</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: { alignItems: 'center', paddingVertical: 24 },
    editBadge: { position: 'absolute', bottom: 0, right: 0, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 2, borderColor: 'white' },
    accordionContent: { padding: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
    input: { marginBottom: 12, backgroundColor: 'transparent' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    saveButton: { marginTop: 8 },
    sectionHeader: { fontWeight: 'bold', marginTop: 8, marginBottom: 12 },
    footer: { padding: 16, marginTop: 20 },
});