import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { generateTourReportHTML } from '../screens/GenerateTourReport';

export const generateAndShareTourPDF = async (
  tourTitle: string,
  stops: Array<{ title: string; description?: string; stop_order: number }>
) => {
  try {
    // Generar HTML
    const html = generateTourReportHTML(tourTitle, stops);

    // Crear PDF
    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,   // A4 en puntos (210mm × 297mm)
      height: 842,
    });

    // Compartir
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        dialogTitle: `Informe del tour: ${tourTitle}`,
        mimeType: 'application/pdf',
      });
    } else {
      Alert.alert(
        'No disponible',
        'El compartir no está disponible en este dispositivo. El PDF se generó pero no se puede compartir.'
      );
    }
  } catch (error) {
    console.error('Error al generar PDF:', error);
    Alert.alert('Error', 'No se pudo generar el informe PDF. Intenta de nuevo.');
  }
};