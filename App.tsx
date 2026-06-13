import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
} from 'react-native';

import DocumentPicker from 'react-native-document-picker';
import PdfCompressor from './modules/pdfcompressor';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [quality, setQuality] = useState('medium');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const pickAndCompress = async () => {
    try {
      const file = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf],
      });

      setLoading(true);
      setResult(null);

      const output = await PdfCompressor.compressPdf(
        file.uri,
        quality
      );

      setResult(output);
    } catch (e: any) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert(
          'Compression Failed',
          e.message || 'Something went wrong'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const sharePdf = async () => {
    try {
      await Share.share({
        url: result.outputPath,
        message: 'Compressed PDF',
      });
    } catch {}
  };

  const reductionPercent = result
    ? (
        ((result.originalSize - result.compressedSize) /
          result.originalSize) *
        100
      ).toFixed(1)
    : '0';

  const savedBytes = result
    ? result.originalSize - result.compressedSize
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.icon}>📄</Text>

          <Text style={styles.title}>
            PDF Compressor
          </Text>

          <Text style={styles.subtitle}>
            Compress PDFs completely offline on
            your device.
          </Text>
        </View>

        <View style={styles.qualityContainer}>
  <Text style={styles.qualityTitle}>
    Compression Level
  </Text>

  <TouchableOpacity
    style={[
      styles.qualityCard,
      quality === 'high' && styles.selectedCard,
    ]}
    onPress={() => setQuality('high')}
  >
    <Text style={styles.qualityCardTitle}>
      Best Quality
    </Text>

    <Text style={styles.qualityCardSubtitle}>
      Sharpest text • Lower compression
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.qualityCard,
      quality === 'medium' && styles.selectedCard,
    ]}
    onPress={() => setQuality('medium')}
  >
    <Text style={styles.qualityCardTitle}>
      Balanced
    </Text>

    <Text style={styles.qualityCardSubtitle}>
      Recommended • Best balance
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.qualityCard,
      quality === 'low' && styles.selectedCard,
    ]}
    onPress={() => setQuality('low')}
  >
    <Text style={styles.qualityCardTitle}>
      Maximum Compression
    </Text>

    <Text style={styles.qualityCardSubtitle}>
      Smallest file size
    </Text>
  </TouchableOpacity>
</View>

        <TouchableOpacity
          style={[
            styles.compressButton,
            loading && { opacity: 0.7 },
          ]}
          disabled={loading}
          onPress={pickAndCompress}
        >
          <Text style={styles.compressButtonText}>
            Select PDF & Compress
          </Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" />

            <Text style={styles.loadingText}>
              Compressing PDF...
            </Text>

            <Text style={styles.loadingSubtext}>
              Please wait a few seconds
            </Text>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              Compression Complete
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>
                  Original
                </Text>

                <Text style={styles.statValue}>
                  {formatSize(
                    result.originalSize
                  )}
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>
                  Compressed
                </Text>

                <Text style={styles.statValue}>
                  {formatSize(
                    result.compressedSize
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.savingsCard}>
              <Text style={styles.savedPercent}>
                {reductionPercent}% Smaller
              </Text>

              <Text style={styles.savedText}>
                Saved {formatSize(savedBytes)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={sharePdf}
            >
              <Text style={styles.shareButtonText}>
                Share / Save PDF
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  content: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },

  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },

  icon: {
    fontSize: 72,
    marginBottom: 12,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111',
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },

  compressButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 24,
  },

  compressButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },

  loadingSubtext: {
    color: '#666',
    marginTop: 6,
  },

  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
  },

  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },

  statLabel: {
    color: '#777',
    marginBottom: 8,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  savingsCard: {
    marginTop: 18,
    backgroundColor: '#EAF8EF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },

  savedPercent: {
    fontSize: 28,
    fontWeight: '800',
  },

  savedText: {
    marginTop: 6,
    color: '#333',
    fontWeight: '600',
  },

  shareButton: {
    backgroundColor: '#111',
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },

  shareButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  qualityContainer: {
  marginBottom: 24,
},

qualityTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#111',
  marginBottom: 12,
},

qualityCard: {
  backgroundColor: '#FFF',
  borderRadius: 16,
  padding: 16,
  marginBottom: 10,
  borderWidth: 2,
  borderColor: '#E5E5EA',
},

selectedCard: {
  borderColor: '#0A84FF',
  backgroundColor: '#F0F7FF',
},

qualityCardTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#111',
},

qualityCardSubtitle: {
  marginTop: 4,
  color: '#666',
  fontSize: 14,
},
});