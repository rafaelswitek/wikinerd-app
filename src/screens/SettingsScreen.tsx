import React, { useState, useContext, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from "react-native";
import {
    Text, TextInput, Button, Switch, List, Avatar, useTheme,
    Divider, Portal, Dialog, SegmentedButtons, ActivityIndicator,
    Menu, IconButton
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker'; // Importar ImagePicker
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { api } from "../services/api";

interface UserPreferences {
    notify_lists: boolean;
    notify_reviews: boolean;
    notify_followers: boolean;
    notify_releases: boolean;
    theme: 'light' | 'dark' | 'system';
    interface_language: string;
    content_language: string;
    profile_visibility: 'all' | 'followers' | 'none';
    show_recent_activity: boolean;
    show_reviews: boolean;
    allow_recommendations: boolean;
    allow_data_collection: boolean;
    allow_third_party_sharing: boolean;
}

export default function SettingsScreen() {
    const theme = useTheme();
    const navigation = useNavigation();
    const { user, signOut, updateUserProfile } = useContext(AuthContext);
    const { isDark, toggleTheme } = useContext(ThemeContext);

    const [loading, setLoading] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [savingSecurity, setSavingSecurity] = useState(false);

    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [website, setWebsite] = useState(user?.website || "");
    const [pickedAvatar, setPickedAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

    const [prefs, setPrefs] = useState<UserPreferences>({
        notify_lists: true,
        notify_reviews: true,
        notify_followers: true,
        notify_releases: true,
        theme: 'system',
        interface_language: 'pt-BR',
        content_language: 'pt-BR',
        profile_visibility: 'all',
        show_recent_activity: true,
        show_reviews: true,
        allow_recommendations: true,
        allow_data_collection: true,
        allow_third_party_sharing: false,
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [secureTextEntry, setSecureTextEntry] = useState({ current: true, new: true, confirm: true });

    const [dialogVisible, setDialogVisible] = useState<'delete' | 'deactivate' | null>(null);
    const [languageMenuVisible, setLanguageMenuVisible] = useState<'interface' | 'content' | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [prefsResponse] = await Promise.all([
                api.get("/users/preferences").catch(() => ({ data: null })),
                updateUserProfile()
            ]);

            if (prefsResponse?.data) {
                setPrefs(prefsResponse.data);
            }

            if (user) {
                setName(user.name);
                setUsername(user.username);
                setBio(user.bio || "");
                setWebsite(user.website || "");
            }

        } catch (error) {
            console.error("Erro ao carregar configurações", error);
            Alert.alert("Erro", "Não foi possível carregar suas configurações.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadData();
    }, []);

    const handleAvatarPress = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setPickedAvatar(result.assets[0]);
            }
        } catch (error) {
            Alert.alert("Erro", "Não foi possível abrir a galeria.");
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const formData = new FormData();

            // Adiciona campos de texto
            formData.append('name', name);
            formData.append('username', username);
            formData.append('bio', bio);
            formData.append('website', website);

            // Adiciona avatar se houver
            if (pickedAvatar) {
                const filename = pickedAvatar.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                // @ts-ignore: FormData no React Native aceita objeto com uri, name e type
                formData.append('avatar', {
                    uri: pickedAvatar.uri,
                    name: filename || 'avatar.jpg',
                    type: type,
                });
            }

            await api.post("/users/profile", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            await updateUserProfile();
            setPickedAvatar(null); // Limpa seleção local após sucesso
            Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Não foi possível atualizar o perfil.";
            Alert.alert("Erro", msg);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSavePreferences = async () => {
        setSavingPrefs(true);
        try {
            const payload = { ...prefs };

            if (prefs.theme === 'dark' && !isDark) toggleTheme();
            if (prefs.theme === 'light' && isDark) toggleTheme();

            await api.put("/users/preferences", payload);
            Alert.alert("Sucesso", "Preferências salvas com sucesso.");
        } catch (error) {
            Alert.alert("Erro", "Falha ao salvar preferências.");
        } finally {
            setSavingPrefs(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert("Erro", "As novas senhas não conferem.");
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Erro", "A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        setSavingSecurity(true);
        try {
            await api.put("/users/password", {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword
            });
            Alert.alert("Sucesso", "Senha alterada com sucesso.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            const msg = error.response?.data?.message || "Erro ao alterar senha. Verifique sua senha atual.";
            Alert.alert("Erro", msg);
        } finally {
            setSavingSecurity(false);
        }
    };

    const renderSwitchRow = (label: string, value: boolean, onValueChange: (val: boolean) => void, description?: string) => (
        <View style={styles.switchContainer}>
            <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 16, color: theme.colors.onSurface }}>{label}</Text>
                {description && <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{description}</Text>}
            </View>
            <Switch value={value} onValueChange={onValueChange} color={theme.colors.primary} />
        </View>
    );

    // Helper para exibir avatar (Local > Remoto > Inicial)
    const renderAvatar = () => {
        if (pickedAvatar) {
            return <Avatar.Image size={100} source={{ uri: pickedAvatar.uri }} />;
        }
        if (user?.avatar) {
            return <Avatar.Image size={100} source={{ uri: user.avatar }} />;
        }
        return <Avatar.Text size={100} label={user?.name?.charAt(0) || "U"} />;
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <List.AccordionGroup>
                    <List.Accordion title="Perfil" id="profile" left={props => <List.Icon {...props} icon="account" />}>
                        <View style={styles.accordionBody}>
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <TouchableOpacity onPress={handleAvatarPress}>
                                    {renderAvatar()}
                                    <View style={[styles.avatarEditBadge, { backgroundColor: theme.colors.primary }]}>
                                        <List.Icon icon="camera" color="white" style={{ margin: 0, padding: 0, width: 16, height: 16 }} />
                                    </View>
                                </TouchableOpacity>
                                <Text style={{ marginTop: 8, color: theme.colors.secondary }}>Toque para alterar</Text>
                            </View>

                            <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
                            <TextInput label="Usuário" value={username} onChangeText={setUsername} mode="outlined" autoCapitalize="none" style={styles.input} />
                            <TextInput label="Biografia" value={bio} onChangeText={setBio} mode="outlined" multiline numberOfLines={3} style={styles.input} />
                            <TextInput label="Website" value={website} onChangeText={setWebsite} mode="outlined" keyboardType="url" autoCapitalize="none" style={styles.input} />

                            <Button mode="contained" onPress={handleSaveProfile} loading={savingProfile} style={styles.saveButton}>
                                Salvar Perfil
                            </Button>
                        </View>
                    </List.Accordion>
                    <Divider />

                    <List.Accordion title="Notificações" id="notifications" left={props => <List.Icon {...props} icon="bell" />}>
                        <View style={styles.accordionBody}>
                            {renderSwitchRow("Listas", prefs.notify_lists, v => setPrefs({ ...prefs, notify_lists: v }), "Interações em suas listas")}
                            <Divider style={styles.rowDivider} />
                            {renderSwitchRow("Reviews", prefs.notify_reviews, v => setPrefs({ ...prefs, notify_reviews: v }), "Interações em suas avaliações")}
                            <Divider style={styles.rowDivider} />
                            {renderSwitchRow("Novos Seguidores", prefs.notify_followers, v => setPrefs({ ...prefs, notify_followers: v }))}
                            <Divider style={styles.rowDivider} />
                            {renderSwitchRow("Lançamentos", prefs.notify_releases, v => setPrefs({ ...prefs, notify_releases: v }), "Itens da sua lista de interesses")}

                            <Button mode="contained" onPress={handleSavePreferences} loading={savingPrefs} style={styles.saveButton}>
                                Salvar Preferências
                            </Button>
                        </View>
                    </List.Accordion>
                    <Divider />

                    <List.Accordion title="Aparência" id="appearance" left={props => <List.Icon {...props} icon="theme-light-dark" />}>
                        <View style={styles.accordionBody}>
                            <Text style={styles.label}>Tema</Text>
                            <SegmentedButtons
                                value={prefs.theme}
                                onValueChange={val => setPrefs({ ...prefs, theme: val as any })}
                                buttons={[
                                    { value: 'light', label: 'Claro', icon: 'white-balance-sunny' },
                                    { value: 'dark', label: 'Escuro', icon: 'weather-night' },
                                    { value: 'system', label: 'Sistema', icon: 'theme-light-dark' },
                                ]}
                                style={{ marginBottom: 16 }}
                            />
                            <Button mode="contained" onPress={handleSavePreferences} loading={savingPrefs} style={styles.saveButton}>
                                Salvar Aparência
                            </Button>
                        </View>
                    </List.Accordion>
                    <Divider />

                    <List.Accordion title="Idioma" id="language" left={props => <List.Icon {...props} icon="web" />}>
                        <View style={styles.accordionBody}>
                            <Text style={styles.label}>Idioma da Interface</Text>
                            <Menu
                                visible={languageMenuVisible === 'interface'}
                                onDismiss={() => setLanguageMenuVisible(null)}
                                anchor={
                                    <Button mode="outlined" onPress={() => setLanguageMenuVisible('interface')} style={{ marginBottom: 16 }} contentStyle={{ justifyContent: 'flex-start' }}>
                                        {prefs.interface_language === 'pt-BR' ? 'Português (Brasil)' : prefs.interface_language}
                                    </Button>
                                }
                            >
                                <Menu.Item onPress={() => { setPrefs({ ...prefs, interface_language: 'pt-BR' }); setLanguageMenuVisible(null); }} title="Português (Brasil)" />
                            </Menu>

                            <Text style={styles.label}>Idioma do Conteúdo</Text>
                            <Menu
                                visible={languageMenuVisible === 'content'}
                                onDismiss={() => setLanguageMenuVisible(null)}
                                anchor={
                                    <Button mode="outlined" onPress={() => setLanguageMenuVisible('content')} contentStyle={{ justifyContent: 'flex-start' }}>
                                        {prefs.content_language === 'pt-BR' ? 'Português (Brasil)' : prefs.content_language}
                                    </Button>
                                }
                            >
                                <Menu.Item onPress={() => { setPrefs({ ...prefs, content_language: 'pt-BR' }); setLanguageMenuVisible(null); }} title="Português (Brasil)" />
                            </Menu>

                            <Button mode="contained" onPress={handleSavePreferences} loading={savingPrefs} style={styles.saveButton}>
                                Salvar Idiomas
                            </Button>
                        </View>
                    </List.Accordion>
                    <Divider />

                    <List.Accordion title="Privacidade" id="privacy" left={props => <List.Icon {...props} icon="shield-account" />}>
                        <View style={styles.accordionBody}>
                            <Text style={styles.label}>Quem pode ver meu perfil</Text>
                            <SegmentedButtons
                                value={prefs.profile_visibility}
                                onValueChange={val => setPrefs({ ...prefs, profile_visibility: val as any })}
                                buttons={[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'followers', label: 'Seguidores' },
                                    { value: 'none', label: 'Ninguém' },
                                ]}
                                style={{ marginBottom: 16 }}
                                density="small"
                            />

                            {renderSwitchRow("Atividade Recente", prefs.show_recent_activity, v => setPrefs({ ...prefs, show_recent_activity: v }), "Mostrar o que você assistiu recentemente")}
                            <Divider style={styles.rowDivider} />
                            {renderSwitchRow("Mostrar Avaliações", prefs.show_reviews, v => setPrefs({ ...prefs, show_reviews: v }), "Permitir que outros vejam suas notas")}
                            <Divider style={styles.rowDivider} />

                            <Text style={[styles.label, { marginTop: 16 }]}>Dados</Text>
                            {renderSwitchRow("Recomendações", prefs.allow_recommendations, v => setPrefs({ ...prefs, allow_recommendations: v }), "Usar histórico para recomendações")}
                            <Divider style={styles.rowDivider} />
                            {renderSwitchRow("Coleta de Dados", prefs.allow_data_collection, v => setPrefs({ ...prefs, allow_data_collection: v }), "Dados anônimos para melhorias")}
                            <Divider style={styles.rowDivider} />
                            {renderSwitchRow("Compartilhamento", prefs.allow_third_party_sharing, v => setPrefs({ ...prefs, allow_third_party_sharing: v }), "Compartilhar com parceiros")}

                            <Button mode="contained" onPress={handleSavePreferences} loading={savingPrefs} style={styles.saveButton}>
                                Salvar Privacidade
                            </Button>
                        </View>
                    </List.Accordion>
                    <Divider />

                    <List.Accordion title="Conta" id="account" left={props => <List.Icon {...props} icon="lock" />}>
                        <View style={styles.accordionBody}>
                            <TextInput label="E-mail" value={user?.email} mode="outlined" disabled style={[styles.input, { opacity: 0.7 }]} />

                            <Text style={[styles.label, { marginTop: 12, color: theme.colors.primary }]}>Alterar Senha</Text>
                            <TextInput
                                label="Senha Atual"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={secureTextEntry.current}
                                mode="outlined"
                                style={styles.input}
                                right={<TextInput.Icon icon={secureTextEntry.current ? "eye" : "eye-off"} onPress={() => setSecureTextEntry(p => ({ ...p, current: !p.current }))} />}
                            />
                            <TextInput
                                label="Nova Senha"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={secureTextEntry.new}
                                mode="outlined"
                                style={styles.input}
                                right={<TextInput.Icon icon={secureTextEntry.new ? "eye" : "eye-off"} onPress={() => setSecureTextEntry(p => ({ ...p, new: !p.new }))} />}
                            />
                            <TextInput
                                label="Confirmar Nova Senha"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={secureTextEntry.confirm}
                                mode="outlined"
                                style={styles.input}
                                right={<TextInput.Icon icon={secureTextEntry.confirm ? "eye" : "eye-off"} onPress={() => setSecureTextEntry(p => ({ ...p, confirm: !p.confirm }))} />}
                            />
                            <Text style={{ fontSize: 12, color: theme.colors.secondary, marginBottom: 12 }}>
                                Mínimo de 8 caracteres.
                            </Text>

                            <Button mode="outlined" onPress={handleChangePassword} loading={savingSecurity}>
                                Alterar Senha
                            </Button>

                            <Divider style={{ marginVertical: 24 }} />

                            <Text style={[styles.label, { color: theme.colors.error }]}>Zona de Perigo</Text>

                            <Button
                                mode="outlined"
                                textColor={theme.colors.error}
                                style={{ borderColor: theme.colors.error, marginBottom: 12 }}
                                onPress={() => setDialogVisible('deactivate')}
                            >
                                Desativar Conta
                            </Button>

                            <Button
                                mode="contained"
                                buttonColor={theme.colors.error}
                                onPress={() => setDialogVisible('delete')}
                            >
                                Excluir Conta Permanentemente
                            </Button>
                        </View>
                    </List.Accordion>

                </List.AccordionGroup>

                <View style={styles.footer}>
                    <Text style={{ color: theme.colors.secondary, fontSize: 12 }}>WikiNerd v1.0.0</Text>
                </View>
            </ScrollView>

            <Portal>
                <Dialog visible={!!dialogVisible} onDismiss={() => setDialogVisible(null)} style={{ backgroundColor: theme.colors.surface }}>
                    <Dialog.Title style={{ color: theme.colors.error }}>
                        {dialogVisible === 'delete' ? 'Excluir Conta?' : 'Desativar Conta?'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {dialogVisible === 'delete'
                                ? "Esta ação é irreversível. Todos os seus dados, listas e avaliações serão apagados permanentemente."
                                : "Sua conta ficará invisível temporariamente. Você poderá reativá-la fazendo login novamente."}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(null)}>Cancelar</Button>
                        <Button
                            onPress={async () => {
                                setDialogVisible(null);
                                setLoading(true);
                                try {
                                    const endpoint = dialogVisible === 'delete' ? "/users/delete" : "/users/deactivate";
                                    if (dialogVisible === 'delete') await api.delete(endpoint);
                                    else await api.delete(endpoint);

                                    await signOut();
                                } catch (error) {
                                    Alert.alert("Erro", "Falha ao processar solicitação.");
                                    setLoading(false);
                                }
                            }}
                            textColor={theme.colors.error}
                        >
                            Confirmar
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, elevation: 4 },
    scrollContent: { paddingBottom: 40 },
    accordionBody: { padding: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
    input: { marginBottom: 12, backgroundColor: 'transparent' },
    label: { fontWeight: 'bold', marginBottom: 8, marginTop: 4 },
    saveButton: { marginTop: 16 },

    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    rowDivider: { marginVertical: 4 },

    avatarEditBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'white'
    },

    footer: { padding: 24, alignItems: 'center' }
});