import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: 'chapters' | 'favorites' | 'dashboard' | 'settings') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'chapters', label: 'Chapters', icon: 'library-books' },
    { id: 'favorites', label: 'Favorites', icon: 'favorite' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
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
          <Icon 
            name={item.icon} 
            size={24} 
            color={currentView === item.id ? '#1e3a8a' : '#64748b'} 
            style={styles.navIcon}
          />
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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