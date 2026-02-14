import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { generateTourReportHTML } from '../components/GenerateTourReport';

// src/utils/pdfReportUtils.ts (o donde la tengas)

export const generateAndShareTourPDF = async (
  tourTitle: string,
  stops: Array<{ title: string; description?: string; stop_order: number }>,
  coverImageUrl?: string   // ← nuevo parámetro opcional
) => {
  try {
    const html = generateTourReportHTML(tourTitle, stops, coverImageUrl);

    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,
      height: 842,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        dialogTitle: `Informe del tour: ${tourTitle}`,
        mimeType: 'application/pdf',
      });
    } else {
      Alert.alert('No disponible', 'Compartir no está disponible en este dispositivo.');
    }
  } catch (error) {
    console.error('Error generando PDF:', error);
    Alert.alert('Error', 'No se pudo generar el informe PDF.');
  }
};