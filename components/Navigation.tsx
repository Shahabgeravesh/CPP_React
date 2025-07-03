import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: 'home' | 'study' | 'stats' | 'settings') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'study', label: 'Study', icon: '📚' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.navigation}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.navItem,
            currentView === item.id && styles.activeNavItem
          ]}
          onPress={() => onNavigate(item.id as any)}
        >
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text style={[
            styles.navLabel,
            currentView === item.id && styles.activeNavLabel
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: '#dbeafe',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
});

export default Navigation; 