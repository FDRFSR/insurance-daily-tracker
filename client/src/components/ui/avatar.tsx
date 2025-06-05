"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { createForwardRefWithClassName } from "@/lib/create-forward-ref"

const Avatar = createForwardRefWithClassName(
  "Avatar",
  AvatarPrimitive.Root,
  "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"
)

const AvatarImage = createForwardRefWithClassName(
  "AvatarImage",
  AvatarPrimitive.Image,
  "aspect-square h-full w-full"
)

const AvatarFallback = createForwardRefWithClassName(
  "AvatarFallback",
  AvatarPrimitive.Fallback,
  "flex h-full w-full items-center justify-center rounded-full bg-muted"
)

export { Avatar, AvatarImage, AvatarFallback }
