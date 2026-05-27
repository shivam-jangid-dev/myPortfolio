import { LenisContext } from '@/context/lenisContext'
import { useContext } from 'react'

export function useLenis() {
  return useContext(LenisContext)
}
