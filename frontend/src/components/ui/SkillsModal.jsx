import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'

const SkillsModal = ({
  title,
  open,
  onClose,
  items,
  onAdd,
  onRemove,
  onSave,
  inputValue,
  onInputChange,
  suggestions = [],
  saving = false,
  inputPlaceholder = 'Add an item',
}) => {
  const filteredSuggestions = useMemo(() => {
    if (!inputValue) return suggestions.slice(0, 10)
    const value = inputValue.toLowerCase()
    return suggestions
      .filter((item) => item.toLowerCase().includes(value))
      .slice(0, 10)
  }, [inputValue, suggestions])

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={saving} loading={saving}>
        Save Changes
      </Button>
    </>
  )

  return (
    <Modal title={title} open={open} onClose={onClose} footer={footer}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Add New</label>
          <div className="flex items-center space-x-3">
            <Input
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onAdd()
                }
              }}
            />
            <Button
              type="button"
              onClick={onAdd}
              variant="outline"
              className="shrink-0"
              disabled={!inputValue.trim() || saving}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {items?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <motion.span
                key={item}
                className="inline-flex items-center space-x-2 rounded-full border border-primary-600 bg-primary-800/80 px-3 py-1 text-sm text-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span>{item}</span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-400"
                  onClick={() => onRemove(item)}
                  aria-label={`Remove ${item}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-primary-600 bg-primary-900/60 p-6 text-center text-sm text-gray-400">
            No items added yet. Use the input above to get started.
          </div>
        )}

        {filteredSuggestions?.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className="rounded-full border border-primary-600 bg-primary-900 px-3 py-1 text-xs text-gray-200 hover:border-accent-500 hover:text-accent-300"
                  onClick={() => {
                    onInputChange(suggestion, { fromSuggestion: true })
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SkillsModal
