"use client"

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion"
import { Check, Loader2, SendHorizontal, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

const DRAG_CONSTRAINTS = { left: 0, right: 155 }
const DRAG_THRESHOLD = 0.9

const BUTTON_STATES = {
  initial: { width: "12rem" },
  completed: { width: "8rem" },
}

const ANIMATION_CONFIG = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
}

type StatusIconProps = {
  status: string
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const iconMap: Record<StatusIconProps["status"], JSX.Element> = useMemo(
    () => ({
      loading: <Loader2 className="animate-spin" size={20} />,
      success: <Check size={20} />,
      error: <X size={20} />,
    }),
    []
  )

  if (!iconMap[status]) return null

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {iconMap[status]}
    </motion.div>
  )
}

const useButtonStatus = (resolveTo: "success" | "error") => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")

  const handleSubmit = useCallback(() => {
    setStatus("loading")
    setTimeout(() => {
      setStatus(resolveTo)
    }, 2000)
  }, [resolveTo])

  return { status, handleSubmit }
}

export interface SlideButtonProps extends ButtonProps {
  status?: "idle" | "loading" | "success" | "error"
  onDragComplete?: () => boolean | Promise<boolean> | void
  resolveTo?: "success" | "error"
}

const SlideButton = forwardRef<HTMLButtonElement, SlideButtonProps>(
  ({ className, status: controlledStatus, onDragComplete, resolveTo = "success", ...props }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [completed, setCompleted] = useState(false)
    const dragHandleRef = useRef<HTMLDivElement | null>(null)
    const dragX = useMotionValue(0)
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring)
    const dragProgress = useTransform(
      springX,
      [0, DRAG_CONSTRAINTS.right],
      [0, 1]
    )
    
    // Internal mock submission if uncontrolled
    const { status: internalStatus, handleSubmit } = useButtonStatus(resolveTo)
    
    // Resolve status based on controlled vs uncontrolled mode
    const status = controlledStatus !== undefined ? controlledStatus : internalStatus

    // Sync completed state if parent resets or transitions status
    useEffect(() => {
      if (controlledStatus === "idle") {
        setCompleted(false)
        dragX.set(0)
      } else if (controlledStatus === "loading" || controlledStatus === "success" || controlledStatus === "error") {
        setCompleted(true)
      }
    }, [controlledStatus, dragX])

    useEffect(() => {
      if (controlledStatus !== "error") return

      const timeout = window.setTimeout(() => {
        setCompleted(false)
        dragX.set(0)
      }, 1200)

      return () => window.clearTimeout(timeout)
    }, [controlledStatus, dragX])

    const handleDragStart = useCallback(() => {
      if (completed) return
      setIsDragging(true)
    }, [completed])

    const handleDragEnd = async () => {
      if (completed) return
      setIsDragging(false)

      const progress = dragProgress.get()
      if (progress >= DRAG_THRESHOLD) {
        let shouldComplete = true
        if (onDragComplete) {
          const res = await onDragComplete()
          // If explicit false is returned, it means validation failed, so snap back
          if (res === false) {
            shouldComplete = false
          }
        }

        if (shouldComplete) {
          setCompleted(true)
          if (controlledStatus === undefined) {
            handleSubmit()
          }
        } else {
          dragX.set(0)
        }
      } else {
        dragX.set(0)
      }
    }

    const handleDrag = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (completed) return
      const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right))
      dragX.set(newX)
    }

    const adjustedWidth = useTransform(springX, (x) => x + 10)
    const trackLabelOpacity = useTransform(dragProgress, [0, 0.5], [1, 0])

    return (
      <motion.div
        animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
        transition={ANIMATION_CONFIG.spring}
        className="shadow-button-inset dark:shadow-button-inset-dark relative flex h-9 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800"
      >
        {!completed && (
          <motion.div
            style={{
              width: adjustedWidth,
            }}
            className="absolute inset-y-0 left-0 z-0 rounded-full bg-accent dark:bg-slate-700"
          />
        )}
        {!completed && (
          <motion.span
            style={{ opacity: trackLabelOpacity }}
            className="absolute z-0 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none select-none"
          >
            Swipe to Submit
          </motion.span>
        )}
        <AnimatePresence mode="wait">
          {!completed && (
            <motion.div
              key="drag-handle"
              ref={dragHandleRef}
              drag="x"
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute -left-4 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
            >
              <Button
                ref={ref}
                disabled={status === "loading"}
                {...props}
                type="button"
                size="icon"
                className={cn(
                  "shadow-button rounded-full drop-shadow-xl",
                  isDragging && "scale-105 transition-transform",
                  className
                )}
              >
                <SendHorizontal className="size-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {completed && (
            <motion.div
              key="status-completed"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                ref={ref}
                disabled={status === "loading"}
                {...props}
                type="button"
                className={cn(
                  "size-full rounded-full transition-all duration-300",
                  className
                )}
              >
                <AnimatePresence mode="wait">
                  <StatusIcon status={status} />
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

SlideButton.displayName = "SlideButton"

export { SlideButton }
