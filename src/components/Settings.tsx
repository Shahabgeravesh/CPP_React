import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';

interface SettingsProps {
  onBack: () => void;
  onResetData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onResetData }) => {
  const [hapticEnabled, setHapticEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all flashcards and progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: onResetData
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>Vibrate on interactions</Text>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={setHapticEnabled}
            trackColor={{ false: '#e2e8f0', true: '#1e3a8a' }}
            thumbColor={hapticEnabled ? '#ffffff' : '#ffffff'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Use dark theme</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#e2e8f0', true: '#1e3a8a' }}
            thumbColor={darkMode ? '#ffffff' : '#ffffff'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetData}>
          <Text style={styles.dangerButtonText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          ASIS CPP Flashcard App v1.0.0{'\n'}
          Built with React Native and Expo{'\n'}
          Designed for ASIS CPP certification preparation
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    fontSize: 16,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});

export default Settings; 