"use client";
// Form: the shadcn/ui integration layer between react-hook-form and the UI
// primitives. It provides accessible field wiring (ids linking label, control,
// description and error message) via two React contexts plus the useFormField
// hook. Typical use: wrap inputs in <Form> (an RHF FormProvider), then render
// <FormField> with a `render` prop, inside which you use <FormItem>, <FormLabel>,
// <FormControl>, <FormDescription> and <FormMessage>.
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Controller, FormProvider, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// Form: alias for react-hook-form's FormProvider; supplies form state via context
// so the hooks below can reach it without prop drilling.
const Form = FormProvider

// Context that carries the current field's `name` down to useFormField.
const FormFieldContext = React.createContext({})

// FormField: connects one field to react-hook-form. Wraps RHF's <Controller>
// (so it forwards name/control/render/rules etc.) and publishes the field name
// through FormFieldContext for the descendant label/control/message components.
const FormField = (
  {
    ...props
  }
) => {
  return (
    (<FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>)
  );
}

// useFormField: hook consumed by the field sub-components. It merges the field
// name (from FormFieldContext) and the generated item id (from FormItemContext)
// with react-hook-form's validation state for that field, and derives the stable
// ids used to associate the label, control, description and error message for a11y.
const useFormField = () => {
  // Field name published by the nearest <FormField>.
  const fieldContext = React.useContext(FormFieldContext)
  // Unique id published by the nearest <FormItem>.
  const itemContext = React.useContext(FormItemContext)
  // Access the surrounding form's state/helpers from react-hook-form.
  const { getFieldState, formState } = useFormContext()

  // Look up this field's validation state (error, dirty, touched, ...).
  const fieldState = getFieldState(fieldContext.name, formState)

  // Guard: this hook only works when rendered under a <FormField>.
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  // Return the field name plus derived element ids and the spread field state.
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// Context that carries a generated unique id for one field row down to useFormField.
const FormItemContext = React.createContext({})

// FormItem: layout wrapper (a spaced <div>) for one field. Generates a unique id
// with React.useId() and shares it via FormItemContext so the label/control/
// message ids all line up for this field.
const FormItem = React.forwardRef(({ className, ...props }, ref) => {
  // Stable unique id; the base for formItemId/formDescriptionId/formMessageId.
  const id = React.useId()

  return (
    (<FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>)
  );
})
FormItem.displayName = "FormItem"

// FormLabel: a <Label> auto-pointed at the field's control via htmlFor, and
// turned destructive-colored when the field has a validation error.
const FormLabel = React.forwardRef(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    (<Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props} />)
  );
})
FormLabel.displayName = "FormLabel"

// FormControl: wraps the actual input via Radix <Slot> (so it merges props onto
// whatever child element you pass) and applies the a11y wiring: id, aria-invalid
// when errored, and aria-describedby pointing at the description and/or message.
const FormControl = React.forwardRef(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    (<Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props} />)
  );
})
FormControl.displayName = "FormControl"

// FormDescription: muted helper text under the control; its id matches the
// control's aria-describedby so screen readers announce it.
const FormDescription = React.forwardRef(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    (<p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props} />)
  );
})
FormDescription.displayName = "FormDescription"

// FormMessage: the field's validation/error line. Shows the RHF error message
// when present, otherwise falls back to its children; renders nothing if empty.
const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  // Prefer the validation error text; fall back to any provided children.
  const body = error ? String(error?.message) : children

  // Nothing to display -> render nothing.
  if (!body) {
    return null
  }

  return (
    (<p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}>
      {body}
    </p>)
  );
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
