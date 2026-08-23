import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff, AlertCircle, type LucideIcon } from 'lucide-react-native';
import { palette, font, inkAlpha } from '~/lib/theme/tokens';

interface FormInputProps extends TextInputProps {
  label: string;
  leftIcon?: LucideIcon;
  rightLabel?: string;
  onRightLabelPress?: () => void;
  error?: string;
  isPassword?: boolean;
}

export function FormInput({
  label,
  leftIcon: LeftIcon,
  rightLabel,
  onRightLabelPress,
  error,
  isPassword = false,
  value,
  onChangeText,
  placeholder,
  ...textInputProps
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isError = Boolean(error);
  const borderColor = isError
    ? palette.bad
    : isFocused
      ? palette.primary
      : palette.line;

  return (
    <View style={{ marginBottom: 16, marginTop: 4, width: '100%', position: 'relative' }}>
      {/* Floating Notch Label */}
      <View
        style={{
          position: 'absolute',
          top: -9,
          left: 14,
          backgroundColor: palette.bg,
          paddingHorizontal: 6,
          zIndex: 2,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: isError ? palette.bad : isFocused ? palette.primary : palette.inkSoft,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </Text>
      </View>

      {/* Input Container */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          borderRadius: 14,
          backgroundColor: isFocused ? '#FFFFFF' : palette.bg,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 14,
        }}
      >
        {/* Left Icon (if provided) */}
        {LeftIcon && (
          <View
            style={{
              width: 26,
              height: 26,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <LeftIcon
              size={17}
              color={isFocused ? palette.primary : palette.inkSoft}
              strokeWidth={2}
            />
          </View>
        )}

        {/* Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={inkAlpha.faint}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            height: 52,
            fontSize: 15,
            fontWeight: '600',
            color: palette.txt,
            paddingVertical: 0,
            textAlignVertical: 'center',
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
          }}
          {...textInputProps}
        />

        {/* Password Toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
            }}
          >
            {showPassword ? (
              <EyeOff size={18} color={palette.inkSoft} />
            ) : (
              <Eye size={18} color={palette.inkSoft} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
            marginLeft: 6,
          }}
        >
          <AlertCircle size={12} color={palette.bad} />
          <Text style={{ color: palette.bad, fontSize: 11.5, fontWeight: '600' }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
