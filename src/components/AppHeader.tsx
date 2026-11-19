
import { StyleSheet, Text, View } from 'react-native';

export default function AppHeader() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>✦</Text>
        </View>

        <View style={styles.brandArea}>
          <Text style={styles.brand}>
            NOBEL EDEBİYAT ARŞİVİ
          </Text>

          <Text style={styles.subtitle}>
            Edebiyat koleksiyonu
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#DAB978',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  logoText: {
    color: '#101C2B',
    fontSize: 23,
    fontWeight: 'bold',
  },

  brandArea: {
    flex: 1,
  },

  brand: {
    color: '#DAB978',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.4,
  },

  subtitle: {
    color: '#AAB7C6',
    fontSize: 12,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#35445A',
    marginTop: 10,
  },
});
