package okuri.core.models.block.structure

import okuri.core.enums.block.FormWidgetType

/**
 * Defines the UI structure of:
 *      - How the form fields are laid out
 *          - The types of widgets used for each field
 *          - Any additional configuration for each widget (e.g., placeholder text, options for dropdowns)
 *          - Internal Validation
 *
 *      The fields should match all keys defined in the BlockSchema for the block
 *
 *      Example JSON Structure:
 *          "fields":{
 *          "name": {"type":"text","placeholder":"Full Name"},
 *          "phone": {"type":"phone","placeholder":"+61 ..."},
 *          "email": {"type":"email"}
 *      },
 *
 */


data class BlockFormStructure(
    val fields: Map<String, FormWidgetConfig>
)

data class FormWidgetConfig(
    val type: FormWidgetType,
    val placeholder: String? = null,
    val options: List<String>? = null
)