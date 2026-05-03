import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Success', 
        'Account created! Please check your email for a confirmation link.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
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

          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ 
              width: 44, height: 44, borderRadius: 22, 
              backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: '#1F2D45', marginBottom: 24 
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#F0F4FF" />
          </TouchableOpacity>

          {/* Heading */}
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#F0F4FF', textAlign: 'center', marginBottom: 8 }}>
            Create Account
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7A99', textAlign: 'center', marginBottom: 32 }}>
            Begin your journey to university wellness.
          </Text>

          {/* Name */}
          <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>Full Name</Text>
          <View style={{
            borderRadius: 14, borderWidth: 1, borderColor: '#1F2D45',
            backgroundColor: '#111827', marginBottom: 16,
          }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Julian Vance"
              placeholderTextColor="#4D5F7A"
              style={{ color: '#F0F4FF', paddingHorizontal: 18, paddingVertical: 16, fontSize: 15 }}
            />
          </View>

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
          <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>Password</Text>
          <View style={{
            borderRadius: 14, borderWidth: 1, borderColor: '#1F2D45',
            backgroundColor: '#111827', marginBottom: 16,
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

          {/* Confirm Password */}
          <Text style={{ color: '#6B7A99', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>Confirm Password</Text>
          <View style={{
            borderRadius: 14, borderWidth: 1, borderColor: '#1F2D45',
            backgroundColor: '#111827', marginBottom: 32,
          }}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#4D5F7A"
              secureTextEntry
              style={{ color: '#F0F4FF', paddingHorizontal: 18, paddingVertical: 16, fontSize: 15 }}
            />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity 
            onPress={handleSignUp}
            disabled={loading}
            style={{
              backgroundColor: '#7C6FEB', borderRadius: 50,
              paddingVertical: 18, marginBottom: 24, alignItems: 'center',
              shadowColor: '#7C6FEB', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>Sign Up</Text>}
          </TouchableOpacity>

          {/* Sign In link */}
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center' }}>
            <Text style={{ color: '#6B7A99', fontSize: 14 }}>
              Already have an account?{' '}
              <Text style={{ color: '#7C6FEB', fontWeight: '800' }}>Log In</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
