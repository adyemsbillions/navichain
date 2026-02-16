// app/auth.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
const API_BASE = 'https://navichain.cravii.ng/api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;

    if (isLogin && (!email || !password)) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    if (!isLogin && (!fullName || !email || !password)) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (!isLogin && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/login.php' : '/register.php';
      const body = isLogin 
        ? { email, password }
        : { full_name: fullName, email, password };

      const response = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // SAVE USER TO ASYNCSTORAGE
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Alert.alert('Success!', data.message, [
          { text: 'OK', onPress: () => router.replace('/(app)/dashboard') }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Check your internet and try again');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your JSX is EXACTLY the same as before
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.appName}>NaviChain</Text>

          <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join NaviChain'}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Login to access your supply chain hub' : 'Create an account to get started'}
          </Text>

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: isLogin ? '#3b82f6' : '#10b981', opacity: loading ? 0.7 : 1 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                {isLogin ? 'Sign Up' : 'Login'}
              </Text>
            </Text>
          </TouchableOpacity>

          <Link href="/" asChild>
            <TouchableOpacity>
              <Text style={styles.backLink}>← Back to Home</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// styles same as before
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f172a', paddingHorizontal: 32, justifyContent: 'center' },
  content: { alignItems: 'center' },
  appName: { fontSize: 42, fontWeight: '800', color: '#60a5fa', marginBottom: 16, letterSpacing: 1.5 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#cbd5e1', marginBottom: 8 },
  subtitle: { fontSize: 17, color: '#94a3b8', textAlign: 'center', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#1e293b', color: '#fff', padding: 18, borderRadius: 16, marginBottom: 16, fontSize: 16 },
  button: { width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', marginVertical: 24, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  toggleText: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  backLink: { color: '#60a5fa', fontSize: 16, textAlign: 'center' },
});