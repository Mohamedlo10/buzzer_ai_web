import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Sparkles, Lock, Database, UserCheck, Mail } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';

export default function PrivacyPolicyScreen() {
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
        <Text className="text-txt font-bold text-xl font-display">Politique de Confidentialité</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <View className="max-w-2xl self-center w-full pb-12">
          {/* Header Badge */}
          <View className="flex-col items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex-col items-center justify-center mb-4">
              <Shield size={32} color={palette.primary} />
            </View>
            <Text className="text-txt font-bold text-2xl font-display text-center mb-2">
              Protection de vos données
            </Text>
            <Text className="text-txt-60 text-sm text-center">
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
