import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletKeys } from '@/features/wallet/hooks/useWalletQueries'
import {
  returnService,
  type ReturnStatus,
  type ShipperReturnActionRequest,
} from '@/services/return.service'

const SHIPPER_RETURN_KEYS = {
  all: ['shipper-returns'] as const,
  available: () => [...SHIPPER_RETURN_KEYS.all, 'available'] as const,
  my: (status?: ReturnStatus) => [...SHIPPER_RETURN_KEYS.all, 'my', { status }] as const,
}

export function useShipperAvailableReturns(enabled = true) {
  return useQuery({
    queryKey: SHIPPER_RETURN_KEYS.available(),
    queryFn: async () => {
      const res = await returnService.getShipperAvailableReturns(0, 50)
      return res.result?.content ?? []
    },
    enabled,
    refetchInterval: enabled ? 10_000 : false,
  })
}

export function useShipperMyReturns(status?: ReturnStatus) {
  return useQuery({
    queryKey: SHIPPER_RETURN_KEYS.my(status),
    queryFn: async () => {
      const res = await returnService.getShipperMyReturns(0, 50, status)
      return res.result?.content ?? []
    },
    refetchInterval: 10_000,
  })
}

export function useShipperAcceptReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => returnService.shipperAccept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPPER_RETURN_KEYS.all })
    },
  })
}

export function useShipperPickupReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: ShipperReturnActionRequest }) =>
      returnService.shipperPickup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPPER_RETURN_KEYS.all })
    },
  })
}

export function useShipperDeliverReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: ShipperReturnActionRequest }) =>
      returnService.shipperDeliver(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPPER_RETURN_KEYS.all })
      qc.invalidateQueries({ queryKey: walletKeys.all })
    },
  })
}

export function useShipperFailReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: ShipperReturnActionRequest }) =>
      returnService.shipperFail(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPPER_RETURN_KEYS.all })
      qc.invalidateQueries({ queryKey: walletKeys.all })
    },
  })
}
