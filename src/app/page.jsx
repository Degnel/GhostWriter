import NeuralNetworkCanvas from '../components/NeuralNetworkCanvas';
import styles from '../styles/NeuralNetwork.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Alan Tuning</h1>
      <NeuralNetworkCanvas />
    </div>
  );
}