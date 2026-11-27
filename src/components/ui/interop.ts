import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

// Komponen pihak ketiga yang perlu menerima className NativeWind. Diimpor sekali di root layout.
cssInterop(Image, { className: 'style' });
cssInterop(LinearGradient, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
