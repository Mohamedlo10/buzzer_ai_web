import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Top Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <ArrowLeft size={18} color={palette.txt} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 20,
            lineHeight: 26,
            color: palette.txt,
            paddingTop: 4,
            flex: 1,
          }}
        >
          Conditions d&apos;Utilisation
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 48 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: palette.primary + '1A',
                borderWidth: 1,
                borderColor: palette.primary + '33',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <FileText size={32} color={palette.primary} />
            </View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 24,
                lineHeight: 32,
                color: palette.txt,
                textAlign: 'center',
                paddingTop: 2,
                marginBottom: 6,
              }}
            >
              Contrat de Licence Utilisateur Final
            </Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.serif,
                fontStyle: 'italic',
                fontSize: 14,
                color: palette.inkSoft,
                textAlign: 'center',
              }}
            >
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
