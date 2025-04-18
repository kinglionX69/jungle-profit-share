import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, Clock, Shield, Leaf, Palmtree, Wallet } from 'lucide-react';
import Header from '@/components/Layout/Header';
import PageContainer from '@/components/Layout/PageContainer';
import { useWallet } from '@/context/WalletContext';
import WalletSelector from '@/components/Auth/WalletSelector';
import { toast } from 'sonner';
import { NFT_COLLECTION_NAME } from '@/utils/aptos/constants';

const Index = () => {
  const navigate = useNavigate();
  const {
    connected,
    connect,
    connectWallet,
    connecting,
    showWalletSelector,
    setShowWalletSelector,
    walletType,
    isAdmin,
    address
  } = useWallet();

  useEffect(() => {
    console.log("Petra wallet detected:", !!window.petra || !!window.aptos);
    console.log("Martian wallet detected:", !!window.martian);
    console.log("Pontem wallet detected:", !!window.pontem);
    console.log("Rise wallet detected:", !!window.rise);
    
    console.log("Wallet connection state:", {
      connected,
      walletType,
      address,
      isAdmin
    });
  }, [connected, walletType, address, isAdmin]);

  const handleConnectPetra = async () => {
    if (!window.petra && !window.aptos) {
      toast.error("Please install Petra Wallet to continue");
      window.open("https://petra.app", "_blank");
      return;
    }
    try {
      console.log("Attempting to connect Petra wallet");
      await connectWallet('petra');
    } catch (error) {
      console.error("Failed to connect Petra wallet:", error);
    }
  };

  const features = [{
    icon: <Award className="h-10 w-10" />,
    title: 'Exclusive Rewards',
    description: `Earn rewards for holding your ${NFT_COLLECTION_NAME} NFTs on Aptos. The only project on Aptos that has a registered company and is sharing profits with its NFT holders. 20% profits back to the community!`
  }, {
    icon: <Clock className="h-10 w-10" />,
    title: '30-Day Claim Cycle',
    description: 'Each NFT can be used to claim rewards once every 30 days.'
  }, {
    icon: <Shield className="h-10 w-10" />,
    title: 'Secure Escrow System',
    description: 'All rewards are held in a secure escrow wallet until claimed.'
  }];

  return <>
      <Header />
      <main className="min-h-[calc(100vh-64px)]">
        <section className="relative overflow-hidden py-20 md:py-32 bg-jungle-pattern">
          <div className="absolute inset-0 bg-gradient-to-b from-jungle-700/30 to-jungle-900/50 z-0"></div>
          <PageContainer className="relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-block animate-float">
                <div className="bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-8 font-nunito">
                  {NFT_COLLECTION_NAME} NFT Rewards on Aptos Testnet
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 slide-up [animation-delay:200ms] font-poppins">
                Share in the <span className="text-amber-400">Jungle's Profits</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 slide-up [animation-delay:400ms] max-w-2xl font-nunito">
                Connect your Petra wallet on Aptos Testnet to view your {NFT_COLLECTION_NAME} NFTs and start earning rewards today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 slide-up [animation-delay:600ms]">
                {connected ? (
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/dashboard')} 
                    className="min-w-[200px] bg-amber-500 hover:bg-amber-600 text-black font-medium shadow-glow hover:shadow-glow"
                  >
                    View Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={handleConnectPetra} 
                    className="min-w-[200px] bg-amber-500 hover:bg-amber-600 text-black font-medium shadow-glow hover:shadow-glow" 
                    disabled={connecting}
                  >
                    {connecting ? 'Connecting...' : (
                      <>
                        <Wallet className="mr-2 h-5 w-5" />
                        Connect Petra Wallet
                      </>
                    )}
                  </Button>
                )}
                
                <WalletSelector 
                  open={showWalletSelector} 
                  onOpenChange={setShowWalletSelector} 
                  onSelectWallet={connectWallet} 
                />
              </div>
            </div>
          </PageContainer>
          
          <div className="absolute -bottom-10 -left-10 w-40 h-40 text-jungle-700/20 animate-leaf-sway">
            <Leaf className="w-full h-full" />
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 text-jungle-700/20 animate-leaf-sway [animation-delay:1s]">
            <Palmtree className="w-full h-full" />
          </div>
        </section>
        
        <section className="py-20 lion-texture">
          <PageContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 font-poppins">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-nunito">
                Our profit-sharing system makes it simple to earn rewards from your NFT holdings.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="p-6 border border-jungle-700/20 glass rounded-lg scale-in hover-lift [animation-delay:var(--delay)] shadow-md" 
                  style={{
                    '--delay': `${800 + index * 200}ms`
                  } as React.CSSProperties}
                >
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg inline-block mb-4">
                    <div>{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 font-poppins">{feature.title}</h3>
                  <p className="text-muted-foreground font-nunito">{feature.description}</p>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>
      </main>
    </>;
};

export default Index;
