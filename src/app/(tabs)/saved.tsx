
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  kayitlariGetir,
  yazarSil,
  type KaydedilenYazar,
} from '../../services/kayitlar';

const RENK = {
  arkaPlan: '#101C2B',
  kart: '#1B2A3B',
  altin: '#DAB978',
  beyaz: '#FFFFFF',
  gri: '#AAB7C6',
  kenar: '#35445A',
  kirmizi: '#F0A7A7',
};

export default function SavedScreen() {
  const router = useRouter();

  const [kayitlar, setKayitlar] =
    useState<KaydedilenYazar[]>([]);

  const [yukleniyor, setYukleniyor] = useState(true);

  // Onay penceresinin açık veya kapalı olma durumu
  const [modalAcik, setModalAcik] = useState(false);

  // Silinmek üzere seçilen yazar
  const [silinecekYazar, setSilinecekYazar] =
    useState<KaydedilenYazar | null>(null);

  const [siliniyor, setSiliniyor] = useState(false);

  // Kaydedilenleri AsyncStorage'dan getir
  const listeyiYenile = useCallback(async () => {
    try {
      const veriler = await kayitlariGetir();
      setKayitlar(veriler);
    } catch (hata) {
      console.log('Kayıtlar okunamadı:', hata);
      Alert.alert('Hata', 'Kayıtlar okunamadı.');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      listeyiYenile();
    }, [listeyiYenile])
  );

  // Sil butonuna basıldığında modal açılır
  function silmeOnayiAc(yazar: KaydedilenYazar) {
    setSilinecekYazar(yazar);
    setModalAcik(true);
  }

  // Vazgeç butonuna basıldığında kayıt korunur
  function vazgec() {
    if (siliniyor) return;

    setModalAcik(false);
    setSilinecekYazar(null);
  }

  // Onaylanan yazarı kalıcı olarak sil
  async function silmeyiOnayla() {
    if (!silinecekYazar || siliniyor) return;

    try {
      setSiliniyor(true);

      await yazarSil(silinecekYazar.id);
      await listeyiYenile();

      setModalAcik(false);
      setSilinecekYazar(null);
    } catch (hata) {
      console.log('Silme hatası:', hata);
      Alert.alert('Hata', 'Kayıt silinemedi.');
    } finally {
      setSiliniyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.ustBaslik}>
          KİŞİSEL KOLEKSİYON
        </Text>

        <Text style={styles.title}>
          Kaydedilenler
        </Text>

        <Text style={styles.description}>
          Nobel edebiyat arşivinizde sakladığınız isimler
        </Text>

        <View style={styles.countBox}>
          <Text style={styles.countText}>
            {kayitlar.length} kayıtlı yazar
          </Text>
        </View>

        {yukleniyor ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator
              size="large"
              color={RENK.altin}
            />

            <Text style={styles.emptyText}>
              Kayıtlar yükleniyor...
            </Text>
          </View>
        ) : (
          <FlatList
            data={kayitlar}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>
                  ♡
                </Text>

                <Text style={styles.emptyTitle}>
                  Henüz kayıt yok
                </Text>

                <Text style={styles.emptyText}>
                  Beğendiğiniz Nobel ödüllü yazarları
                  buraya ekleyebilirsiniz.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const ad =
                item.knownName?.en ??
                item.orgName?.en ??
                'İsim bilinmiyor';

              const yil =
                item.nobelPrizes?.[0]?.awardYear ??
                'Bilinmiyor';

              return (
                <View style={styles.card}>
                  <Pressable
                    style={styles.cardMain}
                    onPress={() =>
                      router.push({
                        pathname: '/detail',
                        params: {
                          item: JSON.stringify(item),
                        },
                      })
                    }
                  >
                    <View style={styles.imageBox}>
                      {item.fotograf ? (
                        <Image
                          source={{
                            uri: item.fotograf,
                          }}
                          style={styles.image}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.fallback}>
                          ✦
                        </Text>
                      )}
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.year}>
                        NOBEL EDEBİYAT · {yil}
                      </Text>

                      <Text
                        style={styles.name}
                        numberOfLines={2}
                      >
                        {ad}
                      </Text>

                      <Text style={styles.subtitle}>
                        Detayları görüntüle
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => silmeOnayiAc(item)}
                    style={styles.deleteButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${ad} kaydını sil`}
                  >
                    <Text style={styles.deleteText}>
                      Sil
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* ÖZEL SİLME ONAY PENCERESİ */}
      <Modal
        visible={modalAcik}
        transparent
        animationType="fade"
        onRequestClose={vazgec}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <Text style={styles.modalIcon}>✕</Text>
            </View>

            <Text style={styles.modalTitle}>
              Kaydı silmek istiyor musunuz?
            </Text>

            <Text style={styles.modalDescription}>
              {silinecekYazar
                ? `${
                    silinecekYazar.knownName?.en ??
                    silinecekYazar.orgName?.en ??
                    'Bu yazar'
                  } kişisel koleksiyonunuzdan çıkarılacak.`
                : ''}
            </Text>

            <Text style={styles.modalQuestion}>
              Emin misiniz?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={vazgec}
                disabled={siliniyor}
              >
                <Text style={styles.cancelText}>
                  Vazgeç
                </Text>
              </Pressable>

              <Pressable
                style={styles.confirmButton}
                onPress={silmeyiOnayla}
                disabled={siliniyor}
              >
                {siliniyor ? (
                  <ActivityIndicator
                    color={RENK.arkaPlan}
                  />
                ) : (
                  <Text style={styles.confirmText}>
                    Kaydı Sil
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RENK.arkaPlan,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  ustBaslik: {
    color: RENK.altin,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 14,
  },
  title: {
    color: RENK.beyaz,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    color: RENK.gri,
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 26,
  },
  countBox: {
    borderBottomWidth: 1,
    borderBottomColor: RENK.kenar,
    paddingBottom: 16,
    marginBottom: 20,
  },
  countText: {
    color: RENK.altin,
    fontSize: 13,
  },
  list: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: RENK.kart,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RENK.kenar,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageBox: {
    width: 65,
    height: 78,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: RENK.kenar,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    color: RENK.altin,
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  year: {
    color: RENK.altin,
    fontSize: 10,
    marginBottom: 7,
    fontWeight: '600',
  },
  name: {
    color: RENK.beyaz,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    color: RENK.gri,
    fontSize: 12,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: RENK.kirmizi,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 10,
  },
  deleteText: {
    color: RENK.kirmizi,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 75,
    gap: 12,
  },
  emptyIcon: {
    color: RENK.altin,
    fontSize: 55,
  },
  emptyTitle: {
    color: RENK.beyaz,
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    color: RENK.gri,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },

  // Modal arka planı
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalBox: {
    backgroundColor: RENK.kart,
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RENK.kenar,
  },
  modalIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#453039',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    color: RENK.kirmizi,
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: RENK.beyaz,
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    color: RENK.gri,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  modalQuestion: {
    color: RENK.gri,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 25,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: RENK.kenar,
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: RENK.beyaz,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: RENK.altin,
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: RENK.arkaPlan,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
