// Example: app/(app)/knowledge.tsx
import { ScrollView, StyleSheet, Text } from 'react-native';

export default function Knowledge() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Knowledge & Standards</Text>
      <Text style={styles.content}>
        Reference point for correct supply chain practice including:
        • International standards (WHO, ISO, CIPS, APICS, GS1){'\n'}
        • Local regulatory adaptation (Nigeria-specific){'\n'}
        • Standard Operating Procedures (SOPs){'\n'}
        • Policies & governance frameworks{'\n'}
        • Ethical standards & compliance{'\n'}
        • Case studies, terminology, KPIs
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#60a5fa', marginBottom: 20 },
  content: { fontSize: 17, color: '#cbd5e1', lineHeight: 28 },
});