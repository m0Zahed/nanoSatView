import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@mui/material';
import { useState } from 'react';
import styles from '@/styles/Home.module.css';
import Sidebar from '@/components/Sidebar';
import Engine from '@/components/Engine';
import { satellite_search_params } from '@/interfaces/sat_data_intf';

export default function EnginePage() {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  // trackedSatList is the interface between the Sidebar, Engine and Satellite Manager 
  const [trackedSatList, setTrackedSat] = useState<satellite_search_params[]>([]);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <>
      <Head>
        <title>nanoSat</title>
        <meta name="description" content="Satellite visualization engine" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className={styles.header}>
        <a
          href="https://github.com/m0Zahed/nanoSatView"
          target="_blank"
          rel="noopener noreferrer"
        >
          nanoSatView
        </a>
      </header>
      <div className={styles.container}>
        <Link className={styles.engineBackLink} href="/">
          Back to Dashboard
        </Link>
        <Button
          variant="contained"
          color="primary"
          onClick={toggleSidebar}
          sx={{ position: 'absolute', top: '20px', left: '20px', zIndex: 20 }}
        >
          {isSidebarVisible ? '' : 'Open Search'}
        </Button>
        <Engine trackedSatList={trackedSatList} setTrackedSat={setTrackedSat} />
        <Sidebar
          trackedSatList={trackedSatList}
          setTrackedSat={setTrackedSat}
          isVisible={isSidebarVisible}
          toggle={toggleSidebar}
        />
      </div>
    </>
  );
}
