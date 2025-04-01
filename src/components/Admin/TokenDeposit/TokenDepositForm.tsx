
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IS_TESTNET } from '@/utils/aptos/constants';

interface TokenDepositFormProps {
  amount: string;
  setAmount: (value: string) => void;
  selectedToken: string;
  handleTokenChange: (value: string) => void;
}

const TokenDepositForm: React.FC<TokenDepositFormProps> = ({
  amount,
  setAmount,
  selectedToken,
  handleTokenChange
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="token-amount">Amount</Label>
      <div className="flex gap-2">
        <Input
          id="token-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          className="flex-1"
        />
        {/* On testnet, only show APT option - on mainnet, show both options */}
        {IS_TESTNET ? (
          <div className="flex items-center px-3 py-2 bg-muted rounded-md font-medium">
            APT
          </div>
        ) : (
          <RadioGroup 
            value={selectedToken}
            onValueChange={handleTokenChange}
            className="flex gap-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="apt" id="apt" />
              <Label htmlFor="apt" className="cursor-pointer">APT</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="emojicoin" id="emojicoin" />
              <Label htmlFor="emojicoin" className="cursor-pointer">EMOJICOIN</Label>
            </div>
          </RadioGroup>
        )}
      </div>
    </div>
  );
};

export default TokenDepositForm;
