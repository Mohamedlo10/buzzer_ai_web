import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, HelpCircle, Mail, MessageSquare, CheckCircle, Send, Sparkles } from 'lucide-react-native';
import { palette, inkAlpha } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';

export default function SupportScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !message.trim()) {
      notify.error('Veuillez remplir votre email et votre message.');
      return;
    }
    setIsSending(true);
    // Simulate support ticket dispatch
    setTimeout(() => {
      setIsSending(false);
      setSent(true);
      notify.success('Message envoyé au support !');
    }, 800);
  };

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
        <Text className="text-txt font-bold text-xl font-display">Centre d&apos;aide & Support</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <View className="max-w-2xl self-center w-full pb-12">
          {/* Header Badge */}
          <View className="flex-col items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex-col items-center justify-center mb-4">
              <HelpCircle size={32} color={palette.primary} />
            </View>
            <Text className="text-txt font-bold text-2xl font-display text-center mb-2">
              Comment pouvons-nous vous aider ?
            </Text>
            <Text className="text-txt-60 text-sm text-center">
              L&apos;équipe Xalaat est disponible pour répondre à vos questions.
            </Text>
          </View>

          {/* FAQ Preview */}
          <View className="bg-surface rounded-3xl p-6 border border-line mb-6">
            <Text className="text-txt font-bold text-lg mb-4">Questions fréquentes</Text>
            <View className="flex-col gap-4">
              <View className="pb-3 border-b border-line">
                <Text className="text-txt font-semibold text-sm mb-1">Comment rejoindre une partie ?</Text>
                <Text className="text-txt-60 text-xs leading-relaxed">
                  Entrez le code à 6 chiffres fourni par l&apos;hôte ou scannez le QR code de la session depuis l&apos;écran d&apos;accueil.
                </Text>
              </View>
              <View className="pb-3 border-b border-line">
                <Text className="text-txt font-semibold text-sm mb-1">Comment fonctionne le buzzer ?</Text>
                <Text className="text-txt-60 text-xs leading-relaxed">
                  Appuyez sur le bouton central dès que vous connaissez la réponse. Le système ordonne les buzzers au millième de seconde. Sur ordinateur, la barre ESPACE déclenche le buzzer.
                </Text>
              </View>
              <View>
                <Text className="text-txt font-semibold text-sm mb-1">Comment signaler une question inexacte ?</Text>
                <Text className="text-txt-60 text-xs leading-relaxed">
                  Cliquez sur l&apos;icône de signalement lors de l&apos;affichage de la question ou contactez le support directement ci-dessous.
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Form */}
          <View className="bg-surface rounded-3xl p-6 border border-line">
            <Text className="text-txt font-bold text-lg mb-2">Contactez-nous</Text>
            <Text className="text-txt-60 text-xs mb-5">
              Une réponse vous sera envoyée sous 24 à 48 heures ouvrées.
            </Text>

            {!sent ? (
              <View className="flex-col gap-4">
                <View className="flex-col gap-1.5">
                  <Text className="text-txt-60 text-xs font-semibold uppercase">Nom ou Pseudo</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Votre nom"
                    placeholderTextColor={inkAlpha.faint}
                    className="w-full px-4 py-3.5 rounded-2xl bg-bg text-txt text-base border border-line"
                  />
                </View>

                <View className="flex-col gap-1.5">
                  <Text className="text-txt-60 text-xs font-semibold uppercase">Email *</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="votre@email.com"
                    placeholderTextColor={inkAlpha.faint}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="w-full px-4 py-3.5 rounded-2xl bg-bg text-txt text-base border border-line"
                  />
                </View>

                <View className="flex-col gap-1.5">
                  <Text className="text-txt-60 text-xs font-semibold uppercase">Message *</Text>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Décrivez votre problème ou suggestion..."
                    placeholderTextColor={inkAlpha.faint}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="w-full px-4 py-3.5 rounded-2xl bg-bg text-txt text-base border border-line min-h-[100px]"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={isSending}
                  activeOpacity={0.8}
                  className="w-full py-4 rounded-2xl bg-host flex-row items-center justify-center shadow-sm mt-2"
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={palette.primaryInk} />
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Send size={18} color={palette.primaryInk} />
                      <Text className="text-primary-ink font-bold text-base">Envoyer le message</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-col items-center text-center py-4">
                <CheckCircle size={36} color={palette.good} />
                <Text className="text-txt font-bold text-lg mt-3 mb-1">Message transmis !</Text>
                <Text className="text-txt-60 text-xs text-center">
                  Nous avons bien reçu votre demande et reviendrons vers vous très prochainement.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
