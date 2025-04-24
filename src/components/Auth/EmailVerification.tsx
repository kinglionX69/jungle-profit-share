import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { useWallet } from '@/context/WalletContext';
import { getUserData, updateUserEmail } from '@/api/userApi';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const EmailVerification = () => {
  const { email, isVerified, setEmail, setIsVerified } = useUser();
  const { address } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: email || '',
    },
  });
  
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const userData = await getUserData(address);
        console.log("Fetched user verification status:", userData);
        
        // If user exists and has verified email, set verified state
        if (userData?.email_verified) {
          setEmail(userData.email);
          setIsVerified(true);
          emailForm.setValue('email', userData.email || '');
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkVerificationStatus();
  }, [address]);
  
  // Don't show the form if user is already verified
  if (loading) {
    return (
      <div className="flex items-center p-4 text-sm rounded-lg border bg-card">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mr-2"></div>
        <span className="font-bungee">Checking verification status...</span>
      </div>
    );
  }
  
  if (isVerified && email) {
    return (
      <div className="flex items-center p-4 text-sm rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
        <span className="font-bungee">Email: <span className="font-medium">{email}</span></span>
      </div>
    );
  }
  
  // Only show email form if not verified
  return (
    <div className="rounded-lg border p-4 bg-card">
      <h3 className="text-lg font-luckiest mb-4">Add Your Email</h3>
      
      <p className="text-sm text-muted-foreground mb-4 font-bungee">
        Add Email to verify Claim
      </p>
      
      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} className="font-bungee" />
                </FormControl>
                <FormMessage className="font-bungee" />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={submitting} className="font-bungee">
            {submitting ? 'Saving...' : 'Save Email'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EmailVerification;
