import { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { CheckCircle, Send } from 'lucide-react-native';

import { partnersApi } from '~/lib/api';
import { apiErrorMessage } from '~/lib/ui/notify';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';
import { useAuthStore } from '~/stores/useAuthStore';

interface PartnerApplyFormProps {
  /** Appelé depuis l'écran de confirmation, une fois la demande partie. */
  onDone: () => void;
  /** Signale la saisie entamée : l'hôte protège alors la feuille d'une fermeture accidentelle. */
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Formulaire « devenir partenaire ».
 *
 * Volontairement sans `Modal` : il est monté à deux endroits — dans la fiche partenaire
 * (`PartnerProfileModal`, en bascule du contenu) et dans `PartnerApplyModal` ouvert depuis
 * l'annuaire. Empiler deux `Modal` natifs est le piège documenté dans `shared/ConfirmHost.tsx`.
 *
 * Le retour utilisateur est rendu dans le formulaire, jamais via `notify` : `setNotifyHandler`
 * n'est branché que dans `apps/web-legacy`, donc dans l'application joueur `notify.error` se
 * contente d'un `console.error` que personne ne voit.
 */
export function PartnerApplyForm({ onDone, onDirtyChange }: PartnerApplyFormProps) {
  const currentUser = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState('');
  // `email` est `string | null` sur UserResponse. Le champ reste éditable : un commerçant veut
  // souvent être joint sur l'adresse de sa société plutôt que sur celle de son compte de joueur.
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [companyDescription, setCompanyDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  /** Marque la saisie comme entamée dès la première frappe. */
  function markDirty() {
    onDirtyChange?.(true);
  }

  const handleSend = async () => {
    if (!fullName.trim()) {
      setError('Indiquez votre prénom et votre nom.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Indiquez une adresse email valide pour que nous puissions vous répondre.');
      return;
    }
    if (!companyDescription.trim()) {
      setError("Décrivez en quelques lignes l'entreprise qui souhaite devenir partenaire.");
      return;
    }

    setError(null);
    setIsSending(true);
    try {
      await partnersApi.submitPartnerApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        companyDescription: companyDescription.trim(),
        phone: phone.trim() || undefined,
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      });
      setSent(true);
      onDirtyChange?.(false);
    } catch (err: unknown) {
      // La demande passe par la file des tickets de support : sa garde anti-spam s'applique ici.
      const e = err as { response?: { status?: number; data?: { error?: string } } };
      if (e?.response?.status === 429 || e?.response?.data?.error === 'TOO_MANY_OPEN_TICKETS') {
        setError(
          "Vous avez déjà plusieurs demandes en cours. Attendez notre réponse avant d'en envoyer une nouvelle.",
        );
      } else {
        setError(apiErrorMessage(err, "Impossible d'envoyer votre demande pour le moment."));
      }
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 28 }}>
        <CheckCircle size={40} color={palette.good} />
        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 18,
            color: palette.txt,
            marginTop: 12,
            paddingTop: 3,
          }}
        >
          Demande transmise !
        </Text>
        <Text
          style={{
            fontFamily: font.nativeFamily.ui,
            fontSize: 13,
            lineHeight: 20,
            color: palette.inkSoft,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          L&apos;équipe Xalaat étudie votre candidature et vous recontacte à l&apos;adresse
          indiquée.
        </Text>

        <TouchableOpacity
          onPress={onDone}
          activeOpacity={0.8}
          style={{
            marginTop: 20,
            paddingVertical: 13,
            paddingHorizontal: 32,
            borderRadius: 16,
            backgroundColor: palette.surface2,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 14, color: palette.txt }}>
            Fermer
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <Text
        style={{
          fontFamily: font.nativeFamily.serif,
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 20,
          color: palette.inkSoft,
        }}
      >
        Parlez-nous de votre entreprise : nous revenons vers vous pour construire le partenariat.
      </Text>

      <Field
        label="Prénom et nom *"
        value={fullName}
        onChangeText={(v) => {
          markDirty();
          setFullName(v);
        }}
        placeholder="Awa Diop"
        maxLength={120}
      />

      <Field
        label="Email *"
        value={email}
        onChangeText={(v) => {
          markDirty();
          setEmail(v);
        }}
        placeholder="contact@votre-entreprise.sn"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={255}
      />

      <Field
        label="Votre entreprise *"
        value={companyDescription}
        onChangeText={(v) => {
          markDirty();
          setCompanyDescription(v);
        }}
        placeholder="Activité, ville, ancienneté, ce que vous aimeriez apporter à Xalaat…"
        multiline
        textAlignVertical="top"
        maxLength={3000}
        inputStyle={{ minHeight: 110, paddingTop: 12 }}
      />

      <Field
        label="Téléphone personnel"
        value={phone}
        onChangeText={(v) => {
          markDirty();
          setPhone(v);
        }}
        placeholder="+221 77 000 00 00"
        keyboardType="phone-pad"
        maxLength={40}
      />

      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: palette.inkSoft,
          marginTop: 4,
        }}
      >
        Réseaux sociaux (facultatif)
      </Text>

      <Field
        label="Instagram"
        value={instagram}
        onChangeText={(v) => {
          markDirty();
          setInstagram(v);
        }}
        placeholder="@votre_compte"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={200}
      />

      <Field
        label="TikTok"
        value={tiktok}
        onChangeText={(v) => {
          markDirty();
          setTiktok(v);
        }}
        placeholder="@votre_compte"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={200}
      />

      <Field
        label="WhatsApp"
        value={whatsapp}
        onChangeText={(v) => {
          markDirty();
          setWhatsapp(v);
        }}
        placeholder="+221 77 000 00 00"
        keyboardType="phone-pad"
        maxLength={40}
      />

      <Field
        label="LinkedIn"
        value={linkedin}
        onChangeText={(v) => {
          markDirty();
          setLinkedin(v);
        }}
        placeholder="https://linkedin.com/company/…"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={300}
      />

      {error ? (
        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: palette.bad + '1A',
            borderWidth: 1,
            borderColor: palette.bad + '55',
          }}
        >
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontSize: 13,
              lineHeight: 19,
              color: palette.bad,
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={handleSend}
        disabled={isSending}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 15,
          borderRadius: 16,
          backgroundColor: palette.primary,
          opacity: isSending ? 0.7 : 1,
        }}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={palette.primaryInk} />
        ) : (
          <>
            <Send size={17} color={palette.primaryInk} />
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontSize: 15,
                fontWeight: '700',
                color: palette.primaryInk,
              }}
            >
              Envoyer ma demande
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  inputStyle?: TextInputProps['style'];
};

/**
 * Un champ étiqueté, au gabarit visuel de `ContactRow` dans la fiche partenaire.
 *
 * `components/shared/FormInput.tsx` existe, mais son étiquette flottante en encoche est pensée
 * pour les écrans d'authentification pleine page ; empilée huit fois dans une feuille plafonnée
 * à 85 % de l'écran, elle se lit moins bien qu'une étiquette posée au-dessus.
 */
function Field({ label, inputStyle, ...inputProps }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: font.nativeFamily.ui, fontSize: 12, color: palette.inkSoft }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={inkAlpha.faint}
        style={[
          {
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: palette.surface2,
            borderWidth: 1,
            borderColor: palette.line,
            fontFamily: font.nativeFamily.ui,
            fontSize: 14,
            color: palette.txt,
          },
          inputStyle,
        ]}
        {...inputProps}
      />
    </View>
  );
}
