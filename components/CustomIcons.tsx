import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const CustomIcon: React.FC<CustomIconProps> = ({ 
  name, 
  size = 24, 
  color = '#1e3a8a', 
  style 
}) => {
  return (
    <Icon 
      name={name} 
      size={size} 
      color={color} 
      style={style}
    />
  );
};

// Predefined icon mappings for consistency
export const Icons = {
  // Navigation
  chapters: 'library-books',
  favorites: 'favorite',
  dashboard: 'dashboard',
  settings: 'settings',
  
  // Chapter icons
  security: 'security',
  business: 'business',
  search: 'search',
  people: 'people',
  location: 'location-on',
  crisis: 'warning',
  
  // Action icons
  bookmark: 'favorite',
  bookmarkBorder: 'favorite-border',
  star: 'star',
  starBorder: 'star-border',
  arrowBack: 'arrow-back',
  arrowForward: 'arrow-forward',
  check: 'check',
  close: 'close',
  
  // Status icons
  success: 'check-circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
  
  // Study icons
  book: 'book',
  school: 'school',
  assignment: 'assignment',
  quiz: 'quiz',
  
  // UI icons
  menu: 'menu',
  more: 'more-vert',
  add: 'add',
  edit: 'edit',
  delete: 'delete',
  share: 'share',
  download: 'download',
  upload: 'upload',
};

export default CustomIcon; 