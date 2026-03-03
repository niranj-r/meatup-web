import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { CheckCircle, XCircle, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

type BannerType = 'success' | 'error';

interface StatusBannerProps {
    visible: boolean;
    type: BannerType;
    message: string;
    onClose?: () => void;
    duration?: number;
}

export default function StatusBanner({ visible, type, message, onClose, duration = 3000 }: StatusBannerProps) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const [isVisible, setIsVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 40
            }).start();

            if (duration > 0) {
                const timer = setTimeout(() => {
                    hide();
                }, duration);
                return () => clearTimeout(timer);
            }
        } else {
            hide();
        }
    }, [visible]);

    const hide = () => {
        Animated.timing(translateY, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsVisible(false);
            if (onClose) onClose();
        });
    };

    if (!isVisible) return null;

    const isSuccess = type === 'success';
    const backgroundColor = isSuccess ? Colors.cream : Colors.extrared;
    const Icon = isSuccess ? CheckCircle : XCircle;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
            <SafeAreaView style={{ backgroundColor }}>
                <View style={[styles.content, { backgroundColor }]}>
                    <Icon size={24} color={Colors.deepTeal} />
                    <Text style={styles.message} numberOfLines={2}>
                        {message}
                    </Text>
                    <TouchableOpacity onPress={hide} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <X size={20} color="rgba(106, 37, 37, 0.8)" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        // Add extra padding for status bar if on Android
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 12,
    },
    message: {
        flex: 1,
        color: Colors.deepTeal,
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
