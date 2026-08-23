import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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

  const backgroundColor = isFocused ? '#FFFFFF' : palette.bg;

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: palette.txt,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
        {rightLabel && (
          <TouchableOpacity
            onPress={onRightLabelPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: palette.primary,
              }}
            >
              {rightLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Input Container */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          borderRadius: 16,
          backgroundColor,
          borderWidth: isFocused ? 1.5 : 1,
          borderColor,
          paddingHorizontal: 12,
          shadowColor: isFocused ? palette.primary : '#000',
          shadowOpacity: isFocused ? 0.08 : 0.02,
          shadowRadius: isFocused ? 8 : 4,
          elevation: isFocused ? 2 : 1,
        }}
      >
        {/* Left Icon */}
        {LeftIcon && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: isFocused ? `${palette.primary}14` : palette.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <LeftIcon
              size={17}
              color={isFocused ? palette.primary : palette.inkSoft}
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
            fontSize: 15,
            fontWeight: '600',
            color: palette.txt,
            height: '100%',
            paddingVertical: 0,
          }}
          {...textInputProps}
        />

        {/* Password Toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4 }}
          >
            {showPassword ? (
              <EyeOff size={19} color={palette.inkSoft} />
            ) : (
              <Eye size={19} color={palette.inkSoft} />
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
            gap: 5,
            marginTop: 6,
            marginLeft: 4,
          }}
        >
          <AlertCircle size={13} color={palette.bad} />
          <Text style={{ color: palette.bad, fontSize: 12, fontWeight: '600' }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
