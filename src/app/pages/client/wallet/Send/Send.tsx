import React, { useRef, useState } from 'react';
import { PageNavContent } from '../../../../components/page';
import { WalletNavMode, SendNavMode } from '../types';
import { SendHomepage } from './SendHomepage';
import { SelectAsset } from './SelectAsset';
import { SelectToAddress } from './SelectToAddress';

export function Send({ setWalletNavMode }: { setWalletNavMode: (mode: WalletNavMode) => void }) {
  const [sendNavMode, setSendNavMode] = useState<SendNavMode>(SendNavMode.SendMain);

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageNavContent scrollRef={scrollRef}>
      {sendNavMode === SendNavMode.SendMain && (
        <SendHomepage setWalletNavMode={setWalletNavMode} setSendNavMode={setSendNavMode} />
      )}
      {sendNavMode === SendNavMode.SendSelectAsset && (
        <SelectAsset setSendNavMode={setSendNavMode} />
      )}
      {sendNavMode === SendNavMode.SendSelectToAddress && (
        <SelectToAddress setSendNavMode={setSendNavMode} />
      )}
    </PageNavContent>
  );
}
