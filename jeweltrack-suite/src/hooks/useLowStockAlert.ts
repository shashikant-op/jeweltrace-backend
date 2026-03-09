import { useEffect, useRef } from 'react';
import { useProducts, createNotification, useNotifications, acknowledgeNotification } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function useLowStockAlert() {
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: notifications, isLoading: isLoadingNotifications, isSuccess: isNotificationsLoaded } = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sessionAlerts = useRef<Set<string>>(new Set()); // Prevents repeat sounds in same session
  const DISMISS_KEY = 'lowStockDismiss';

  const playAlertSound = () => {
    try {
      console.log('Attempting to play alert sound...');
      // Using a very standard system sound URL
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.volume = 0.5;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('Sound played successfully'))
          .catch(err => {
            console.warn('Audio playback failed (usually requires user interaction):', err);
          });
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  useEffect(() => {
    // CRITICAL: Don't do anything if data is still loading or if it's not successfully loaded yet
    if (isLoadingProducts || isLoadingNotifications || !isNotificationsLoaded || !products || products.length === 0) return;

    const processAlerts = async () => {
      const dismissRaw = localStorage.getItem(DISMISS_KEY);
      const dismissMap: Record<string, number> = dismissRaw ? JSON.parse(dismissRaw) : {};
      const now = Date.now();

      const currentLowStock = products.filter((p: any) => p.quantity <= p.min_stock_alert);

      for (const item of currentLowStock) {
        const dismissUntil = dismissMap[item.id];
        if (dismissUntil && dismissUntil > now) {
          continue;
        } else if (dismissUntil && dismissUntil <= now) {
          delete dismissMap[item.id];
        }

        // 1. Skip if already alerted in this session (local cache)
        if (sessionAlerts.current.has(item.id)) continue;

        // 2. Check for any ACTIVE (unresolved) notifications for this product in the DB
        // Even if it's acknowledged, we shouldn't show the TOAST again.
        const activeNotification = notifications?.find(
          (n: any) => n.product_id === item.id && n.type === 'low_stock' && n.is_resolved === 0
        );

        // 3. Only alert if there is no ACTIVE notification in the DB
        if (!activeNotification) {
          // Add to session cache immediately to prevent repeat triggers while creating
          sessionAlerts.current.add(item.id);

          // Play sound immediately when we detect a brand new alert
          playAlertSound();

          // Save notification to database
          try {
            const response = await createNotification({
              product_id: item.id,
              title: "Low Stock Alert",
              message: `${item.name} has only ${item.quantity} left in stock.`,
              type: "low_stock"
            });
            
            const newNotification = response.notification;
            
            // Force immediate invalidation to update header badge and list
            await queryClient.invalidateQueries({ queryKey: ['notifications'] });

            // Show interactive sonner toast
            let toastId: string | number | undefined;
            toastId = toast.error("Low Stock Alert!", {
              description: `${item.name} has only ${item.quantity} left in stock.`,
              duration: Infinity,
              action: {
                label: "Add Stock",
                onClick: async () => {
                  await acknowledgeNotification(newNotification.id);
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  navigate('/inventory');
                  if (toastId !== undefined) {
                    try { (toast as any).dismiss?.(toastId); } catch {}
                  }
                  const raw = localStorage.getItem(DISMISS_KEY);
                  const map: Record<string, number> = raw ? JSON.parse(raw) : {};
                  map[item.id] = Date.now() + 60 * 60 * 1000;
                  localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
                },
              },
              cancel: {
                label: "Add Later",
                onClick: async () => {
                  await acknowledgeNotification(newNotification.id);
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  if (toastId !== undefined) {
                    try { (toast as any).dismiss?.(toastId); } catch {}
                  }
                  const raw = localStorage.getItem(DISMISS_KEY);
                  const map: Record<string, number> = raw ? JSON.parse(raw) : {};
                  map[item.id] = Date.now() + 12 * 60 * 60 * 1000;
                  localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
                },
              },
            });
          } catch (error) {
            console.error('Failed to handle notification:', error);
            // Remove from session cache on failure so we can try again
            sessionAlerts.current.delete(item.id);
          }
        } else {
          // Already notified and unresolved in DB, mark in session cache to prevent sound/toast on next check
          sessionAlerts.current.add(item.id);
        }
      }
      localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissMap));
    };

    processAlerts();
  }, [products, notifications, isLoadingProducts, isLoadingNotifications, queryClient, navigate]);
}
