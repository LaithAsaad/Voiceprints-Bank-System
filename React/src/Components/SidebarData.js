import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import * as Io5Icons from 'react-icons/io5';

export const SidebarData = (isAdmin) => {
  if (isAdmin) {
    return [
      { title: 'Home', path: '/dashboard/home', icon: <AiIcons.AiFillHome />, cName: 'nav-text' },
      { title: 'All Users', path: '/dashboard/users', icon: <IoIcons.IoIosPeople />, cName: 'nav-text' },
      { title: 'Settings', path: '/dashboard/settings', icon: <Io5Icons.IoSettingsOutline />, cName: 'nav-text' },
      { title: 'Upload', path: '/dashboard/upload', icon: <FaIcons.FaCloudUploadAlt />, cName: 'nav-text' },
      { title: 'Search', path: '/dashboard/search', icon: <Io5Icons.IoSearchSharp />, cName: 'nav-text' }
    ];
  } else {
    return [
      { title: 'Home', path: '/dashboard/user/home', icon: <AiIcons.AiFillHome />, cName: 'nav-text' },
      { title: 'Upload', path: '/dashboard/user/upload', icon: <FaIcons.FaCloudUploadAlt />, cName: 'nav-text' },
      { title: 'Search', path: '/dashboard/user/search', icon: <Io5Icons.IoSearchSharp />, cName: 'nav-text' }
    ];
  }
}