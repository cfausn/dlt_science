import { useState, useEffect, useCallback } from 'react'
import { MetaMaskInpageProvider } from '@metamask/providers'
import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
  }
}

interface MetaMaskState {
  isConnected: boolean
  account: string | null
  chainId: string | null
  error: string | null
  isInitializing: boolean
}

export const useMetaMask = () => {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    chainId: null,
    error: null,
    isInitializing: true
  })

  // Check for existing connection on page load
  const checkConnection = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ 
        ...prev, 
        error: 'MetaMask is not installed',
        isInitializing: false
      }))
      return
    }

    try {
      // Get accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      }) as string[]

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string

      console.log('MetaMask check connection:', { accounts, chainId })

      setState({
        isConnected: accounts.length > 0,
        account: accounts[0] || null,
        chainId,
        error: null,
        isInitializing: false
      })
    } catch (error) {
      console.error('Error checking MetaMask connection:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to check MetaMask connection',
        isInitializing: false
      }))
    }
  }, [])

  // Run connection check on mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask is not installed' }))
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[]

      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string

      setState({
        isConnected: true,
        account: accounts[0],
        chainId,
        error: null,
        isInitializing: false
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to connect to MetaMask',
        isConnected: false,
        isInitializing: false
      }))
    }
  }, [])

  const disconnect = useCallback(async () => {
    console.log('MetaMask: Disconnecting...')
    setState(prev => {
      console.log('MetaMask: Setting state to disconnected', {
        prevState: prev,
        newState: {
          isConnected: false,
          account: null,
          chainId: prev.chainId,
          error: null,
          isInitializing: false
        }
      })
      return {
        ...prev,
        isConnected: false,
        account: null,
        chainId: prev.chainId,
        error: null,
        isInitializing: false
      }
    })
    console.log('MetaMask: Disconnected')
  }, [])

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: unknown) => {
        const newAccounts = accounts as string[]
        setState(prev => ({
          ...prev,
          account: newAccounts[0] || null,
          isConnected: !!newAccounts[0],
          isInitializing: false
        }))
      })

      window.ethereum.on('chainChanged', (chainId: unknown) => {
        setState(prev => ({
          ...prev,
          chainId: chainId as string,
          isInitializing: false
        }))
      })

      window.ethereum.on('connect', () => {
        console.log('MetaMask connected event')
        checkConnection()
      })

      window.ethereum.on('disconnect', () => {
        console.log('MetaMask disconnected event')
        setState(prev => ({
          ...prev,
          isConnected: false,
          account: null,
          isInitializing: false
        }))
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {})
        window.ethereum.removeListener('chainChanged', () => {})
        window.ethereum.removeListener('connect', () => {})
        window.ethereum.removeListener('disconnect', () => {})
      }
    }
  }, [checkConnection])

  const getProvider = useCallback(() => {
    if (!window.ethereum) return null
    return new Web3Provider(window.ethereum as any)
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    getProvider,
  }
}

export default useMetaMask 