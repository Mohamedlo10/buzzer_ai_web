import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Lock, Database, UserCheck, Mail } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';

export default function PrivacyPolicyScreen() {
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
          Politique de Confidentialité
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 48 }}>
          {/* Header Badge */}
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
              <Shield size={32} color={palette.primary} />
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
              Protection de vos données
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

          {/* Section 1: Introduction */}
          <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
            <View className="flex-row items-center gap-3 mb-3">
              <Lock size={20} color={palette.primary} />
              <Text className="text-txt font-bold text-lg">1. Introduction</Text>
            </View>
            <Text className="text-txt-60 text-sm leading-relaxed">
              Xalaat (développé par MouhaDev) s&apos;engage à protéger la vie privée des utilisateurs de son application de quiz multijoueur. Cette politique détaille les données que nous collectons, la manière dont nous les utilisons et vos droits conformément aux réglementations applicables (RGPD, CCPA et directives Apple/Google).
            </Text>
          </View>

          {/* Section 2: Données collectées */}
          <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
            <View className="flex-row items-center gap-3 mb-3">
              <Database size={20} color={palette.gold} />
              <Text className="text-txt font-bold text-lg">2. Données collectées</Text>
            </View>
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Nous collectons uniquement les informations nécessaires au bon fonctionnement de l&apos;application :
            </Text>
            <View className="flex-col gap-2 pl-2">
              <Text className="text-txt-60 text-sm">• <Text className="text-txt font-semibold">Compte :</Text> nom d&apos;utilisateur, adresse email, mot de passe chiffré (hashé).</Text>
              <Text className="text-txt-60 text-sm">• <Text className="text-txt font-semibold">Authentification tierce (Google / Apple) :</Text> identifiant unique de compte et adresse email fournie par le fournisseur.</Text>
              <Text className="text-txt-60 text-sm">• <Text className="text-txt font-semibold">Données de jeu :</Text> scores, historique des parties, dettes virtuelles et statistiques de parties.</Text>
              <Text className="text-txt-60 text-sm">• <Text className="text-txt font-semibold">Notifications push :</Text> token d&apos;appareil pour les invitations et alertes de jeu.</Text>
            </View>
          </View>

          {/* Section 3: Vos Droits & Suppression */}
          <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
            <View className="flex-row items-center gap-3 mb-3">
              <UserCheck size={20} color={palette.good} />
              <Text className="text-txt font-bold text-lg">3. Vos droits et suppression</Text>
            </View>
            <Text className="text-txt-60 text-sm leading-relaxed mb-3">
              Vous disposez à tout moment d&apos;un droit d&apos;accès, de rectification et de suppression totale de vos données personnelles :
            </Text>
            <Text className="text-txt-60 text-sm leading-relaxed">
              Vous pouvez demander la suppression immédiate et définitive de votre compte directement depuis les paramètres de votre profil ou en contactant notre support. Toutes les données associées seront définitivement purgées.
            </Text>
          </View>

          {/* Section 4: Contact */}
          <View className="bg-surface rounded-3xl p-6 border border-line">
            <View className="flex-row items-center gap-3 mb-3">
              <Mail size={20} color={palette.indigo} />
              <Text className="text-txt font-bold text-lg">4. Contact</Text>
            </View>
            <Text className="text-txt-60 text-sm leading-relaxed">
              Pour toute question concernant cette politique ou vos données personnelles, contactez-nous à : <Text className="text-accent font-semibold">privacy@xalaat.app</Text> ou <Text className="text-accent font-semibold">support@mouhadev.com</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
