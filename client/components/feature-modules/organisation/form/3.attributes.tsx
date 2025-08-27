"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { TextSeparator } from "@/components/ui/text-separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical, Braces, Type, Hash, ToggleLeft } from "lucide-react"
import { type FC, useEffect, useState } from "react"
import { toast } from "sonner"
import type { OrganisationStepFormProps } from "../OrganisationForm"

interface CustomAttributeField {
  id: string
  key: string
  value: any
  type: "string" | "number" | "boolean" | "object"
  children?: CustomAttributeField[]
  isExpanded?: boolean
  depth?: number
}

const OrganisationAttributesForm: FC<OrganisationStepFormProps> = ({ form, handleFormSubmit, handlePreviousPage }) => {
  const [fields, setFields] = useState<CustomAttributeField[]>([])
  const [nextId, setNextId] = useState(1)

  // ---------- HELPERS ----------
  useEffect(() => {
    // Initialize customAttributes if it doesn't exist
    const existing = form.getValues("customAttributes")
    if (!existing) {
      form.setValue("customAttributes", {})
      return
    }

    // Only convert if existing has actual properties
    if (existing && typeof existing === "object" && Object.keys(existing).length > 0) {
      const convertedFields = objectToFields(existing, 0)
      setFields(convertedFields)
      setNextId(getMaxId(convertedFields) + 1)
    }
  }, [form])

  const generateId = () => {
    const id = nextId.toString()
    setNextId((prev) => prev + 1)
    return id
  }

  const getMaxId = (fields: CustomAttributeField[]): number => {
    let maxId = 0
    fields.forEach((field) => {
      const id = Number.parseInt(field.id)
      if (id > maxId) maxId = id
      if (field.children) {
        const childMaxId = getMaxId(field.children)
        if (childMaxId > maxId) maxId = childMaxId
      }
    })
    return maxId
  }

  const objectToFields = (obj: Record<string, any>, depth = 0): CustomAttributeField[] => {
    if (!obj || typeof obj !== "object") {
      return []
    }

    return Object.entries(obj).map(([key, value]) => {
      const id = generateId()
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return {
          id,
          key,
          value: {},
          type: "object",
          children: objectToFields(value, depth + 1),
          isExpanded: true,
          depth,
        }
      } else if (typeof value === "number") {
        return { id, key, value, type: "number", depth }
      } else if (typeof value === "boolean") {
        return { id, key, value, type: "boolean", depth }
      } else {
        return { id, key, value: value ?? "", type: "string", depth }
      }
    })
  }

  const fieldsToObject = (fields: CustomAttributeField[]): Record<string, any> => {
    if (!fields || !Array.isArray(fields)) {
      return {}
    }

    const result: Record<string, any> = {}
    fields.forEach((field) => {
      if (!field || !field.key || !field.key.trim()) return
      if (field.type === "object" && field.children) {
        result[field.key] = fieldsToObject(field.children)
      } else {
        result[field.key] = field.value
      }
    })
    return result
  }

  const updateFormValue = (newFields: CustomAttributeField[]) => {
    const objectValue = fieldsToObject(newFields)
    form.setValue("customAttributes", objectValue)
  }

  // ---------- CRUD ----------
  const findAndUpdateField = (
    fields: CustomAttributeField[],
    targetId: string,
    updater: (field: CustomAttributeField) => CustomAttributeField,
  ): CustomAttributeField[] => {
    if (!fields || !Array.isArray(fields)) {
      return []
    }

    return fields.map((field) => {
      if (!field) return field
      if (field.id === targetId) {
        return updater(field)
      }
      if (field.children && Array.isArray(field.children)) {
        return {
          ...field,
          children: findAndUpdateField(field.children, targetId, updater),
        }
      }
      return field
    })
  }

  const findAndRemoveField = (fields: CustomAttributeField[], targetId: string): CustomAttributeField[] => {
    if (!fields || !Array.isArray(fields)) {
      return []
    }

    return fields.filter((field) => {
      if (!field || field.id === targetId) return false
      if (field.children && Array.isArray(field.children)) {
        field.children = findAndRemoveField(field.children, targetId)
      }
      return true
    })
  }

  const findAndAddChild = (
    fields: CustomAttributeField[],
    parentId: string,
    newChild: CustomAttributeField,
  ): CustomAttributeField[] => {
    if (!fields || !Array.isArray(fields)) {
      return []
    }

    return fields.map((field) => {
      if (!field) return field
      if (field.id === parentId) {
        return {
          ...field,
          children: [...(field.children || []), newChild],
          isExpanded: true,
        }
      }
      if (field.children && Array.isArray(field.children)) {
        return {
          ...field,
          children: findAndAddChild(field.children, parentId, newChild),
        }
      }
      return field
    })
  }

  const addField = (parentId?: string, depth = 0) => {
    const newField: CustomAttributeField = {
      id: generateId(),
      key: "",
      value: "",
      type: "string",
      children: [],
      isExpanded: false,
      depth,
    }

    let newFields: CustomAttributeField[]
    if (parentId) {
      newFields = findAndAddChild(fields, parentId, newField)
    } else {
      newFields = [...fields, newField]
    }

    setFields(newFields)
    updateFormValue(newFields)
  }

  const updateField = (id: string, updates: Partial<CustomAttributeField>) => {
    const newFields = findAndUpdateField(fields, id, (field) => {
      const updated = { ...field, ...updates }

      // Handle type changes
      if (updates.type && updates.type !== field.type) {
        switch (updates.type) {
          case "boolean":
            updated.value = false
            break
          case "number":
            updated.value = 0
            break
          case "object":
            updated.value = {}
            updated.children = updated.children || []
            break
          default:
            updated.value = ""
        }
      }

      return updated
    })

    setFields(newFields)
    updateFormValue(newFields)
  }

  const removeField = (id: string) => {
    const newFields = findAndRemoveField(fields, id)
    setFields(newFields)
    updateFormValue(newFields)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "string":
        return <Type className="w-4 h-4" />
      case "number":
        return <Hash className="w-4 h-4" />
      case "boolean":
        return <ToggleLeft className="w-4 h-4" />
      case "object":
        return <Braces className="w-4 h-4" />
      default:
        return <Type className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "number":
        return "bg-green-100 text-green-800 border-green-200"
      case "boolean":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "object":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const renderField = (field: CustomAttributeField): React.ReactNode => {
    const isObject = field.type === "object"
    const depth = field.depth || 0
    const indentClass = depth > 0 ? `ml-${Math.min(depth * 6, 24)}` : ""

    return (
      <div key={field.id} className={`${indentClass} mb-4`}>
        <div className="group relative">
          {/* Main field card */}
          <div className="border border-border rounded-lg bg-card hover:shadow-md transition-all duration-200">
            {/* Field header */}
            <div className="p-4 pb-3">
              <div className="flex items-start gap-3">
                {/* Drag handle */}
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                </div>

                {/* Field content */}
                <div className="flex-1 space-y-3">
                  {/* Key and type row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-1 block">Field Name</Label>
                      <Input
                        placeholder="Enter field name..."
                        value={field.key}
                        onChange={(e) => updateField(field.id, { key: e.target.value })}
                        className="h-9"
                      />
                    </div>

                    <div className="w-40">
                      <Label className="text-sm font-medium mb-1 block">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value as any })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">
                            <div className="flex items-center gap-2">
                              <Type className="w-4 h-4" />
                              Text
                            </div>
                          </SelectItem>
                          <SelectItem value="number">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4" />
                              Number
                            </div>
                          </SelectItem>
                          <SelectItem value="boolean">
                            <div className="flex items-center gap-2">
                              <ToggleLeft className="w-4 h-4" />
                              Yes/No
                            </div>
                          </SelectItem>
                          <SelectItem value="object">
                            <div className="flex items-center gap-2">
                              <Braces className="w-4 h-4" />
                              Object
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Badge variant="outline" className={`${getTypeColor(field.type)} flex items-center gap-1`}>
                      {getTypeIcon(field.type)}
                      {field.type}
                    </Badge>
                  </div>

                  {/* Value input */}
                  {!isObject && (
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Value</Label>
                      {field.type === "string" && (
                        <Input
                          placeholder="Enter text value..."
                          value={field.value}
                          onChange={(e) => updateField(field.id, { value: e.target.value })}
                          className="h-9"
                        />
                      )}
                      {field.type === "number" && (
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value}
                          onChange={(e) => updateField(field.id, { value: Number(e.target.value) })}
                          className="h-9"
                        />
                      )}
                      {field.type === "boolean" && (
                        <div className="flex items-center space-x-2 h-9">
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => updateField(field.id, { value: checked })}
                          />
                          <Label className="text-sm">{field.value ? "Enabled" : "Disabled"}</Label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Object controls and children */}
            {isObject && (
              <div className="border-t border-border">
                <div className="p-4 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateField(field.id, { isExpanded: !field.isExpanded })}
                        className="h-8 w-8 p-0"
                      >
                        {field.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                      <span className="text-sm font-medium text-muted-foreground">
                        {field.children?.length || 0} field{(field.children?.length || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addField(field.id, depth + 1)}
                      className="h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </div>

                  {field.isExpanded && field.children && field.children.length > 0 && (
                    <div className="space-y-3 border-l-2 border-muted pl-4">
                      {field.children.map((child) => renderField(child))}
                    </div>
                  )}

                  {field.isExpanded && (!field.children || field.children.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Braces className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No fields yet</p>
                      <p className="text-xs">Click "Add Field" to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---------- SUBMIT ----------
  const onBack = () => handlePreviousPage("billing")

  const onSubmit = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error("Please fix validation errors before submitting")
      return
    }
    const formValues = form.getValues()
    await handleFormSubmit(formValues)
  }

  // ---------- UI ----------
  return (
    <>
      <CardContent className="pb-8">
        <div className="flex flex-col space-y-6">
          <div className="mt-6">
            <TextSeparator>
              <span className="text-[1rem] font-semibold">Additional Organisation Info (Optional)</span>
            </TextSeparator>
            <p className="text-sm text-muted-foreground mb-6">
              Create custom fields to store additional information about your organisation. Build simple fields or
              complex nested structures to match your needs.
            </p>

            <FormField
              control={form.control}
              name="customAttributes"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-4">
                      {fields.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                          <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No custom fields yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">Add your first field to get started</p>
                          <Button type="button" onClick={() => addField()} className="mx-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Field
                          </Button>
                        </div>
                      ) : (
                        <>
                          {fields.map((field) => renderField(field))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addField()}
                            className="w-full h-12 border-dashed"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Field
                          </Button>
                        </>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Enhanced JSON Preview */}
            {fields.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium">Preview</h3>
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(fieldsToObject(fields)).length} field
                    {Object.keys(fieldsToObject(fields)).length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="relative">
                  <pre className="bg-muted/50 border rounded-lg p-4 text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    <code className="text-foreground">{JSON.stringify(fieldsToObject(fields), null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between mt-4 py-1 border-t">
        <Button type="button" onClick={onBack} variant="outline" size="sm" className="cursor-pointer bg-transparent">
          Previous Page
        </Button>
        <Button type="button" size="sm" className="cursor-pointer" onClick={onSubmit}>
          Create Organisation
        </Button>
      </CardFooter>
    </>
  )
}

export default OrganisationAttributesForm
