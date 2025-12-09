import React, { type ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'
import Splash from '../../assets/splash-screen.json'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { type ParamListBase } from '@react-navigation/native'

interface SplashScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase, string, undefined>
}

const SplashScreen = ({ navigation }: SplashScreenProps): ReactNode => {
  return (
    <View style={styles.container}>
      <LottieView
        source={Splash}
        style={{ width: '100%', height: '100%' }}
        loop={false}
        autoPlay
        onAnimationFinish={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }]
          })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  }
})

export default SplashScreen
