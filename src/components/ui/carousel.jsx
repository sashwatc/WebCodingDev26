// Carousel: a sliding content slider built on embla-carousel-react. The root
// <Carousel> owns the Embla instance and shares it via context so the content
// track and prev/next buttons stay in sync. Compose as Carousel > CarouselContent
// > CarouselItem(s), plus optional CarouselPrevious / CarouselNext.
import * as React from "react"
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Context carrying the Embla ref/api, orientation, scroll helpers, and the
// can-scroll flags down to the sub-components.
const CarouselContext = React.createContext(null)

// Hook to read the carousel context; throws if used outside a <Carousel />.
function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

// Carousel: root provider. forwardRef. Props: `orientation` (horizontal/vertical),
// `opts` (Embla options), `plugins` (Embla plugins), and `setApi` to expose the
// Embla api to a parent.
const Carousel = React.forwardRef((
  {
    orientation = "horizontal",
    opts,
    setApi,
    plugins,
    className,
    children,
    ...props
  },
  ref
) => {
  // Initialize Embla: carouselRef attaches to the viewport; api drives scrolling.
  // axis is derived from orientation.
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    axis: orientation === "horizontal" ? "x" : "y",
  }, plugins)
  // Track whether prev/next navigation is currently possible (to disable buttons).
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  // Refresh the can-scroll flags from Embla; called on init/select/reInit.
  const onSelect = React.useCallback((api) => {
    if (!api) {
      return
    }

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  // Imperatively scroll one slide backward.
  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  // Imperatively scroll one slide forward.
  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  // Keyboard navigation: Left/Right arrows move between slides.
  const handleKeyDown = React.useCallback((event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      scrollNext()
    }
  }, [scrollPrev, scrollNext])

  // If a `setApi` callback was provided, hand the Embla api up to the parent.
  React.useEffect(() => {
    if (!api || !setApi) {
      return
    }

    setApi(api)
  }, [api, setApi])

  // Subscribe to Embla's select/reInit events to keep can-scroll flags current;
  // unsubscribe on cleanup to avoid leaks.
  React.useEffect(() => {
    if (!api) {
      return
    }

    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("select", onSelect)
    };
  }, [api, onSelect])

  return (
    (<CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}>
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}>
        {children}
      </div>
    </CarouselContext.Provider>)
  );
})
Carousel.displayName = "Carousel"

// CarouselContent: the scrolling track. Its outer div is the Embla viewport
// (carouselRef + overflow-hidden); the inner flex row/column holds the items.
// Negative margin offsets the per-item padding gutter. forwardRef.
const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    (<div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props} />
    </div>)
  );
})
CarouselContent.displayName = "CarouselContent"

// CarouselItem: a single slide; basis-full makes it fill the viewport by default
// (override basis via className for multiple visible slides). forwardRef.
const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    (<div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props} />)
  );
})
CarouselItem.displayName = "CarouselItem"

// CarouselPrevious: icon Button that scrolls back one slide; auto-positioned by
// orientation and disabled when there's nothing earlier to show. forwardRef.
const CarouselPrevious = React.forwardRef(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    (<Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("absolute  h-8 w-8 rounded-full", orientation === "horizontal"
        ? "-left-12 top-1/2 -translate-y-1/2"
        : "-top-12 left-1/2 -translate-x-1/2 rotate-90", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}>
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>)
  );
})
CarouselPrevious.displayName = "CarouselPrevious"

// CarouselNext: icon Button that scrolls forward one slide; auto-positioned by
// orientation and disabled when there's nothing further to show. forwardRef.
const CarouselNext = React.forwardRef(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    (<Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("absolute h-8 w-8 rounded-full", orientation === "horizontal"
        ? "-right-12 top-1/2 -translate-y-1/2"
        : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}>
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>)
  );
})
CarouselNext.displayName = "CarouselNext"

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
