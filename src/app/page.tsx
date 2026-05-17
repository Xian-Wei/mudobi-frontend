'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { MUDOBI_ABI } from '@/lib/abi'
import styles from './page.module.css'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function Home() {
  const [quantity, setQuantity] = useState(1)

  const { address, isConnected } = useAccount()
  const { connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const { data: contractData, refetch } = useReadContracts({
    contracts: [
      { address: CONTRACT_ADDRESS, abi: MUDOBI_ABI, functionName: 'totalSupply' },
      { address: CONTRACT_ADDRESS, abi: MUDOBI_ABI, functionName: 'MAX_SUPPLY' },
    ],
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 15_000 },
  })

  const totalSupply = contractData?.[0]?.result != null ? Number(contractData[0].result) : undefined
  const maxSupply   = contractData?.[1]?.result != null ? Number(contractData[1].result) : undefined
  const remaining   = totalSupply != null && maxSupply != null ? maxSupply - totalSupply : undefined
  const soldOut     = remaining === 0
  const pct         = totalSupply != null && maxSupply ? (totalSupply / maxSupply) * 100 : 0

  const maxQty = Math.min(10, remaining ?? 10)

  const {
    writeContract,
    data: txHash,
    isPending: isMinting,
    error: mintError,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isConfirmed) refetch()
  }, [isConfirmed, refetch])

  function handleMint() {
    if (!CONTRACT_ADDRESS || soldOut) return
    reset()
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: MUDOBI_ABI,
      functionName: 'mint',
      args: [BigInt(quantity)],
    })
  }

  const mintBusy = isMinting || isConfirming

  return (
    <div className={styles.page}>

      {/* ── Painted canvas background ── */}
      <div className={styles.canvas} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobBlue}`} />
        <div className={`${styles.blob} ${styles.blobPink}`} />
        <div className={`${styles.blob} ${styles.blobYellow}`} />
        <div className={`${styles.blob} ${styles.blobMint}`} />
        <div className={`${styles.blob} ${styles.blobAccent1}`} />
        <div className={`${styles.blob} ${styles.blobAccent2}`} />
      </div>
      <div className={styles.grain} aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <span className={styles.logo}>MUDOBI</span>
        {isConnected && address ? (
          <button className={styles.walletBtn} onClick={() => disconnect()}>
            {shortAddr(address)}
          </button>
        ) : (
          <button
            className={styles.walletBtn}
            onClick={() => connect({ connector: injected() })}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </nav>

      {/* ── Main ── */}
      <main className={styles.main}>

        {/* ── Art side ── */}
        <section className={styles.artSide}>
          <div className={styles.nftFrame}>
            <span className={`${styles.sticker} ${styles.stickerFree}`}>FREE MINT</span>
            <span className={`${styles.sticker} ${styles.stickerNFT}`}>NFT</span>
            <Image
              src="/mudobi.png"
              width={400}
              height={400}
              alt="Mudobi — a silver-haired chibi NFT"
              priority
            />
          </div>
          <div className={styles.artTag}>
            <span className={styles.artTagMain}>mud · o · bi</span>
            <span className={styles.artTagSub}>she is watching you</span>
          </div>
        </section>

        {/* ── Mint side ── */}
        <section className={styles.mintSide}>
          <div className={styles.mintPanel}>
            <h1 className={styles.title}>MUDOBI</h1>
            <p className={styles.subtitle}>
              Free mint · {maxSupply?.toLocaleString() ?? '10,000'} total supply
            </p>

            {/* Supply progress */}
            {CONTRACT_ADDRESS ? (
              <div className={styles.supplySection}>
                <div className={styles.supplyBar}>
                  <div className={styles.supplyFill} style={{ width: `${pct}%` }} />
                </div>
                <p className={styles.supplyText}>
                  {totalSupply != null
                    ? `${totalSupply.toLocaleString()} / ${maxSupply?.toLocaleString()} minted`
                    : 'Loading supply…'}
                </p>
              </div>
            ) : (
              <div className={styles.noContract}>
                Contract address not set. Add{' '}
                <code>NEXT_PUBLIC_CONTRACT_ADDRESS</code> to{' '}
                <code>.env.local</code>.
              </div>
            )}

            {/* Quantity */}
            <div className={styles.quantityRow}>
              <button
                className={styles.qBtn}
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className={styles.qValue}>{quantity}</span>
              <button
                className={styles.qBtn}
                onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
              >
                +
              </button>
            </div>

            {/* Mint button */}
            <button
              className={styles.mintBtn}
              onClick={handleMint}
              disabled={!isConnected || !CONTRACT_ADDRESS || soldOut || mintBusy}
            >
              {soldOut
                ? 'SOLD OUT'
                : isMinting
                ? 'CONFIRM IN WALLET…'
                : isConfirming
                ? 'CONFIRMING…'
                : `MINT ${quantity}`}
            </button>

            {!isConnected && (
              <p className={styles.hint}>Connect your wallet to mint</p>
            )}

            {/* Status */}
            {isConfirmed && txHash && (
              <p className={styles.statusSuccess}>
                ✓ Minted! Tx:{' '}
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(txHash)}
                </a>
              </p>
            )}
            {mintError && (
              <p className={styles.statusError}>
                {(mintError as { shortMessage?: string }).shortMessage ?? mintError.message}
              </p>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
