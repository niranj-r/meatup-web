import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RazorpayGatewayProps {
    amount: number;
    orderId: string;
    name: string;
    email: string;
    contact: string;
    onSuccess: (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    onClose: () => void;
    onError?: (errorMsg: string) => void;
}

export default function RazorpayCheckoutGateway({
    amount,
    orderId,
    name,
    email,
    contact,
    onSuccess,
    onClose,
    onError
}: RazorpayGatewayProps) {
    const insets = useSafeAreaInsets();
    const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Secure Payment Gateway</title>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body style="background-color: transparent; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; flex-direction: column;">
      <div id="error-banner" style="display: none; background: #FFF3F3; color: #DC2626; padding: 20px; margin: 20px; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; width: 85%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #FEE2E2;">
        <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; font-weight: 600;">Payment Issue</h3>
        <p id="error-text" style="margin: 0; font-size: 14px; line-height: 1.5;"></p>
        <button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'dismissed' }))" style="margin-top: 16px; background: #DC2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%;">Go Back</button>
      </div>
      <script>
        function showError(msg) {
          var banner = document.getElementById('error-banner');
          var text = document.getElementById('error-text');
          banner.style.display = 'block';
          text.innerText = msg;
        }

        window.onerror = function(message, source, lineno, colno, error) {
          showError(message + " at line " + lineno);
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            status: 'failure', 
            data: { error: message, source: source, line: lineno } 
          }));
          return true;
        };

        document.addEventListener("DOMContentLoaded", function(event) {
          try {
            var options = {
                key: '${RAZORPAY_KEY}',
                amount: ${Math.round(amount * 100)}, 
                currency: 'INR',
                name: 'Meat UP',
                description: 'Secure Payment',
                order_id: '${orderId}',
                handler: function (response){
                    // Send success message back to React Native
                    const message = {
                      status: 'success',
                      data: {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                      }
                    };
                    window.ReactNativeWebView.postMessage(JSON.stringify(message));
                },
                prefill: {
                    name: '${name}',
                    email: '${email}',
                    contact: '${contact}'
                },
                theme: {
                    color: '${Colors.deepTeal}',
                    hide_topbar: false,
                    backdrop_color: 'rgba(0,0,0,0.6)'
                },
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: "Pay via UPI",
                                instruments: [
                                    {
                                        method: "upi"
                                    }
                                ]
                            }
                        },
                        sequence: ["block.upi"],
                        preferences: {
                            show_default_blocks: false
                        }
                    }
                }
            };
            
            var rzp1 = new Razorpay(options);
            
            rzp1.on('payment.failed', function (response){
                const message = {
                  status: 'failure',
                  data: response.error
                };
                window.ReactNativeWebView.postMessage(JSON.stringify(message));
            });

            // Handle modal close
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        const closeBtn = document.getElementById('razorpay-backdrop');
                        if (closeBtn && !closeBtn.dataset.listenerAdded) {
                            closeBtn.dataset.listenerAdded = 'true';
                            closeBtn.addEventListener('click', () => {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'dismissed' }));
                            });
                        }
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Open checkout immediately
            rzp1.open();
          } catch (err) {
            showError(err.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              status: 'failure', 
              data: { error: err.message, stack: err.stack } 
            }));
          }
        });
      </script>
    </body>
    </html>
  `;

    const onMessage = (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.status === 'success') {
                onSuccess(message.data);
            } else if (message.status === 'dismissed') {
                onClose();
            } else if (message.status === 'failure') {
                console.error("WebView Razorpay JS Error:", message.data);
                if (onError && message.data.error) {
                    onError(message.data.error);
                } else if (onError && typeof message.data === 'string') {
                    onError(message.data);
                }
                onClose(); // Alternatively pass error details up
            }
        } catch (e) {
            console.error("Failed to parse WebView message", e);
            if (onError) onError("Failed to parse payment message");
            onClose();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <WebView
                source={{ html: htmlContent }}
                onMessage={onMessage}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={Colors.deepTeal} />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    }
});
