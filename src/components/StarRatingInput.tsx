import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface Props {
  rating: number;
  onRate: (rating: number) => void;
  size?: number;
  color?: string;
}

export default function StarRatingInput({ rating, onRate, size = 32, color = "#eab308" }: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
          <Icon
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={color}
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row" },
});