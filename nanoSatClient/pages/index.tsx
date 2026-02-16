import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Home.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>nanoSat</title>
        <meta name="description" content="System engineering workspace for nanoSatView" />
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
      <main className={styles.dashboard}>
        <section className={styles.dashboardHero}>
          <h1 className={styles.dashboardTitle}>System Engineering RAG Console</h1>
          <p className={styles.dashboardSubtitle}>
            Spin up a new app workspace or jump straight into the satellite visualization engine.
          </p>
          <div className={styles.dashboardActions}>
            <Link className={styles.primaryButton} href="/engine">
              Open Engine
            </Link>
            <button className={styles.secondaryButton} type="button">
              Create New App (Coming Soon)
            </button>
          </div>
        </section>
        <section className={styles.dashboardGrid}>
          <div className={styles.dashboardCard}>
            <h2>Mission Knowledge Base</h2>
            <p>Curate system engineering artifacts for retrieval, QA, and design reviews.</p>
          </div>
          <div className={styles.dashboardCard}>
            <h2>Simulation Workspace</h2>
            <p>Connect RAG insights to live orbits, telemetry, and satellite metadata.</p>
          </div>
          <div className={styles.dashboardCard}>
            <h2>Integration Roadmap</h2>
            <p>Track modules to fold into the new application shell.</p>
          </div>
        </section>
      </main>
    </>
  );
}
