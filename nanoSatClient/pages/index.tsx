import Head from 'next/head';
import { Inter } from 'next/font/google';
import styles from '@/styles/Home.module.css';
import { Button, createTheme } from '@mui/material';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AutocompleteSearchBar from '@/components/AutocompleteSearchBar';
import Engine from '../components/Engine';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };
  
  // custom color for Button Object
  const theme = createTheme({
    palette: {
      primary: {
      main: '#33eb91', // Ensure the color is a string
      },
    },
  });

  return (
    <>
      <Head>
        <title>nanoSatView</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.container}>
        <Button
          variant="contained"
          color="primary"
          onClick={toggleSidebar}
          sx={{ position: 'absolute', top: '20px', left: '20px', zIndex: 20 }}
          theme={theme}
        >
          {isSidebarVisible ? '' : '🔍'}
        </Button>
        <Engine />
        <Sidebar isVisible={isSidebarVisible} toggle={toggleSidebar} />
      </div>
    </>
  );
}
