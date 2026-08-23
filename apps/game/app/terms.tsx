import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Top Bar */}
      <View className="flex-row items-center px-6 py-4 border-b border-line bg-bg">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-surface border border-line flex-row items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>
        <Text className="text-txt font-bold text-xl font-display">Conditions d&apos;Utilisation (CLUF)</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <View className="max-w-2xl self-center w-full pb-12">
          {/* Header */}
          <View className="flex-col items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex-col items-center justify-center mb-4">
              <FileText size={32} color={palette.primary} />
            </View>
            <Text className="text-txt font-bold text-2xl font-display text-center mb-2">
              Contrat de Licence Utilisateur Final (CLUF)
            </Text>
            <Text className="text-txt-60 text-sm text-center">
              Dernière mise à jour : 23 août 2026
            </Text>
          </View>

          {/* Section 1 */}
          <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
            <Text className="text-txt font-bold text-lg mb-3">1. Acceptation des conditions</Text>
            <Text className="text-txt-60 text-sm leading-relaxed">
              En téléchargeant ou utilisant l&apos;application Xalaat, vous acceptez d&apos;être lié par ces conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser l&apos;application.
            </Text>
          </View>

          {/* Section 2: Contenu généré par IA */}
          <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
            <View className="flex-row items-center gap-3 mb-3">
              <AlertTriangle size={20} color={palette.gold} />
              <Text className="text-txt font-bold text-lg">2. Contenu généré par IA & Modération</Text>
            </View>
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Xalaat utilise des modèles d&apos;intelligence artificielle pour générer dynamiquement des questions de quiz et des choix de réponse.
            </Text>
            <View className="flex-col gap-2 pl-2">
              <Text className="text-txt-60 text-sm">• <Text className="text-txt font-semibold">Tolérance zéro pour les contenus abusifs :</Text> Aucun contenu offensant, diffamatoire, haineux ou inapproprié n&apos;est toléré.</Text>
              <Text className="text-txt-60 text-sm">• <Text className="text-txt font-semibold">Signalement immédiat :</Text> Les utilisateurs disposent d&apos;un outil direct pour signaler toute question inappropriée ou inexacte.</Text>
              <Text className="text-txt-60 text-sm">• <Text className="text-txt font-semibold">Modération :</Text> Toute question signalée est immédiatement revue et désactivée si nécessaire.</Text>
            </View>
          </View>

          {/* Section 3: Règles de conduite */}
          <View className="bg-surface rounded-3xl p-6 border border-line">
            <View className="flex-row items-center gap-3 mb-3">
              <ShieldCheck size={20} color={palette.good} />
              <Text className="text-txt font-bold text-lg">3. Règles de conduite</Text>
            </View>
            <Text className="text-txt-60 text-sm leading-relaxed">
              Les pseudonymes et interactions doivent rester respectueux de l&apos;ensemble des participants. L&apos;équipe se réserve le droit de suspendre tout compte ne respectant pas ces directives.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
