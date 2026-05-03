import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#0A0F1D' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#7C6FEB', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="leaf" size={40} color="#fff" />
            </View>
          </View>

          {/* Heading */}
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#F0F4FF', textAlign: 'center', marginBottom: 8 }}>
            Welcome Back
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7A99', textAlign: 'center', marginBottom: 40, paddingHorizontal: 16 }}>
            Return to your sanctuary of wellness and personal growth.
          </Text>

          {/* Email */}
          <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>Email Address</Text>
          <View style={{
            borderRadius: 14, borderWidth: 1, borderColor: '#1F2D45',
            backgroundColor: '#111827', marginBottom: 16,
          }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@university.edu"
              placeholderTextColor="#4D5F7A"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ color: '#F0F4FF', paddingHorizontal: 18, paddingVertical: 16, fontSize: 15 }}
            />
          </View>

          {/* Password */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Password</Text>
            <TouchableOpacity><Text style={{ color: '#7C6FEB', fontSize: 13, fontWeight: '600' }}>Forgot?</Text></TouchableOpacity>
          </View>
          <View style={{
            borderRadius: 14, borderWidth: 1, borderColor: '#1F2D45',
            backgroundColor: '#111827', marginBottom: 28,
          }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#4D5F7A"
              secureTextEntry
              style={{ color: '#F0F4FF', paddingHorizontal: 18, paddingVertical: 16, fontSize: 15 }}
            />
          </View>

          {/* Log In Button */}
          <TouchableOpacity 
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#7C6FEB', borderRadius: 50,
              paddingVertical: 18, marginBottom: 20, alignItems: 'center',
              shadowColor: '#7C6FEB', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
              opacity: loading ? 0.7 : 1
            }}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>Log In</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1F2D45' }} />
            <Text style={{ color: '#4D5F7A', fontSize: 11, marginHorizontal: 16, fontWeight: '800' }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1F2D45' }} />
          </View>

          {/* Guest */}
          <TouchableOpacity
            onPress={signInAnonymously}
            style={{
              borderRadius: 50, paddingVertical: 18,
              backgroundColor: '#111827', alignItems: 'center', marginBottom: 24,
              borderWidth: 1, borderColor: '#1F2D45',
            }}>
            <Text style={{ color: '#F0F4FF', fontWeight: '600', fontSize: 16 }}>
              Continue as Guest
            </Text>
          </TouchableOpacity>

          {/* Sign Up */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ alignItems: 'center' }}>
            <Text style={{ color: '#6B7A99', fontSize: 14 }}>
              Don't have an account?{' '}
              <Text style={{ color: '#7C6FEB', fontWeight: '800' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
