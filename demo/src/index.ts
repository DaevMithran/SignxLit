import { privateKeyToAccount } from "viem/accounts"
import { config } from "dotenv"
import { ethers } from "ethers"
import { LIT_RPC } from "@lit-protocol/constants"
import {
  EvmChains,
  SchemaItem,
  SignProtocolClient,
  SpMode,
} from "@daevm/ethsign-sp-sdk"
import { v4 } from "uuid"
import inquirer from "inquirer"
import chalk from "chalk"
import stringify from "json-stringify-pretty-compact"
import figlet from "figlet"
import { accessControlConditions } from "./types/constants.js"

config()

const displayTitle = () => {
  console.log(
    chalk.magenta(
      figlet.textSync("Sign    x     Lit", {
        font: "Banner3-D",
        horizontalLayout: "default",
        verticalLayout: "default",
        whitespaceBreak: true,
      })
    )
  )
}

const run = async () => {
  displayTitle()

  // Retrieve private key from environment
  const privateKey = process.env.PRIVATE_KEY!
  const account = privateKeyToAccount(privateKey)
  const etherWallet = new ethers.Wallet(
    privateKey,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  )

  console.log(chalk.blue("Creating signing client"))
  const client = new SignProtocolClient(SpMode.OnChain, {
    chain: EvmChains.polygonAmoy,
    account,
    wallet: etherWallet,
  })
  console.log(chalk.green("Connected"))

  const mainMenu = async () => {
    // Main menu for the user to choose an action
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: chalk.cyan("Select an action:"),
        choices: [
          "Create Schema",
          "Resolve Schema",
          "Create Gated Attestation",
          "Resolve Gated Attestation",
          "Revoke Attestation",
          "Exit",
        ],
      },
    ])

    switch (action) {
      case "Create Schema":
        await createSchemaMenu()
        break
      case "Resolve Schema":
        await resolveSchemaMenu()
        break
      case "Create Gated Attestation":
        await createGatedAttestationMenu()
        break
      case "Resolve Gated Attestation":
        await resolveGatedAttestationMenu()
        break
      case "Revoke Attestation":
        await revokeAttestationMenu()
        break
      case "Exit":
        console.log(chalk.yellow("Exiting..."))
        process.exit(0)
    }
  }

  // Create schema menu
  const createSchemaMenu = async () => {
    const { schemaName } = await inquirer.prompt([
      {
        type: "input",
        name: "schemaName",
        message: chalk.cyan("Enter schema name:"),
        default: "TestBioDM1",
      },
    ])

    const { keys } = await inquirer.prompt([
      {
        type: "input",
        name: "keys",
        message: chalk.cyan("Enter schema keys (comma-separated):"),
        validate: (input) => {
          if (input.trim() === "") return "Keys cannot be empty."
          return true
        },
      },
    ])

    const keyArray = keys.split(",").map((key: any) => key.trim())

    const data = keyArray.map((key: any) => ({
      name: key,
      type: "string",
    }))

    console.log(chalk.blue(`Creating schema: ${schemaName}`))
    const createSchemaRes = await client.createSchema({
      name: schemaName,
      data,
    })

    console.log(chalk.green("Schema Created:"))
    console.log(chalk.green(stringify(createSchemaRes, { maxLength: 50 })))

    await mainMenu()
  }

  // Resolve schema menu (dummy example)
  const resolveSchemaMenu = async () => {
    const { schemaId } = await inquirer.prompt([
      {
        type: "input",
        name: "schemaId",
        message: chalk.cyan("Enter schema ID to resolve:"),
      },
    ])

    console.log(chalk.blue(`Resolving schema with ID: ${schemaId}`))
    const resolveSchemaRes = await client.getSchema(schemaId)
    console.log(chalk.green(stringify(resolveSchemaRes, { maxLength: 50 })))

    await mainMenu()
  }

  // Create Gated Attestation menu
  const createGatedAttestationMenu = async () => {
    const { schemaId } = await inquirer.prompt([
      {
        type: "input",
        name: "schemaId",
        message: chalk.cyan("Enter schema ID to create attestation for:"),
      },
    ])

    console.log(chalk.blue(`Resolving schema with ID: ${schemaId}`))
    const resolveSchemaRes = await client.getSchema(schemaId)
    console.log(
      chalk.green(stringify(resolveSchemaRes.data, { maxLength: 50 }))
    )

    const schemaData = resolveSchemaRes.data as SchemaItem[]
    // Extract the field names from the schema response
    const schemaFields: string[] = schemaData.map((field: any) => field.name)

    // Dynamically generate the prompt questions based on the fields
    const questions = schemaFields.map((field) => ({
      type: "input",
      name: field,
      message: chalk.cyan(`Enter value for ${field}:`),
    }))

    // Include schemaId in the prompt answers
    const answers = await inquirer.prompt(questions as any)

    const data = Object.fromEntries(
      schemaFields.map((field) => [field, answers[field]])
    )

    // Start building the access conditions
    const accessConditions = []
    const remainingConditions = accessControlConditions
    let addMore = true

    while (addMore) {
      // Prompt user to select a condition
      const { selectedConditionName } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedConditionName",
          message: chalk.cyan("Select an access control condition:"),
          choices: remainingConditions.map((condition) => condition.name),
        },
      ])

      // Find the selected condition object
      const selectedIndex = remainingConditions.findIndex(
        (condition) => condition.name === selectedConditionName
      )

      if (selectedIndex !== -1) {
        accessConditions.push(
          remainingConditions.splice(selectedIndex, 1)[0].condition
        )
      } else {
        console.log(chalk.red("Invalid condition selected. Try again."))
        continue
      }

      // Ask if the user wants to add another condition
      if (remainingConditions.length == 0) {
        addMore = false
      } else {
        const { addAnother } = await inquirer.prompt([
          {
            type: "confirm",
            name: "addAnother",
            message: chalk.cyan("Do you want to add another condition?"),
            default: false,
          },
        ])

        if (addAnother) {
          // If adding another, prompt for a logical operator
          const { operator } = await inquirer.prompt([
            {
              type: "list",
              name: "operator",
              message: chalk.cyan(
                "Select a logical operator to combine conditions:"
              ),
              choices: ["AND", "OR"],
            },
          ])

          // Add the operator to the array
          accessConditions.push({ operator: operator.toLowerCase() })
        } else {
          addMore = false
        }
      }
    }

    console.log(chalk.blue("Selected Access Conditions:"))
    console.log(chalk.green(stringify(accessConditions, { maxLength: 50 })))
    console.log(chalk.blue("Creating attestation..."))
    const createAttestationRes = await client.createAttestation(
      {
        schemaId: schemaId,
        data,
        indexingValue: v4(),
      },
      {
        gated: true,
        accessControlConditions: accessConditions,
      }
    )

    console.log(chalk.green("Attestation Created:"))
    console.log(chalk.green(stringify(createAttestationRes, { maxLength: 50 })))

    await mainMenu()
  }

  // Resolve Gated Attestation menu
  const resolveGatedAttestationMenu = async () => {
    const { attestationId } = await inquirer.prompt([
      {
        type: "input",
        name: "attestationId",
        message: chalk.cyan("Enter attestation ID to resolve:"),
      },
    ])

    console.log(chalk.blue("Verifying Gated attestation..."))
    const getAttestationRes = await client.getAttestation(attestationId, {
      gated: true,
    })

    console.log(chalk.green("Attestation Resolved:"))
    console.log(chalk.green(stringify(getAttestationRes, { maxLength: 50 })))

    await mainMenu()
  }

  // Revoke Attestation menu
  const revokeAttestationMenu = async () => {
    const { attestationId, reason } = await inquirer.prompt([
      {
        type: "input",
        name: "attestationId",
        message: chalk.cyan("Enter attestation ID to revoke:"),
      },
      {
        type: "input",
        name: "reason",
        message: chalk.cyan("Enter reason for revocation:"),
        default: "Test revocation",
      },
    ])

    console.log(chalk.blue("Revoking attestation..."))
    const revokeAttestationRes = await client.revokeAttestation(attestationId, {
      reason: reason,
    })

    console.log(chalk.green("Attestation Revoked:"))
    console.log(chalk.green(stringify(revokeAttestationRes, { maxLength: 50 })))

    await mainMenu()
  }

  // Start the main menu loop
  await mainMenu()
}

// Graceful shutdown on force close (e.g., Ctrl+C)
process.on("SIGINT", () => {
  console.log(chalk.yellow("\nGracefully shutting down. Goodbye!"))
  process.exit(0)
})

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  console.log(chalk.red("\nUnhandled Rejection. Exiting gracefully..."))
  console.error(reason)
  process.exit(1)
})

// Catch uncaught exceptions
process.on("uncaughtException", (error) => {
  console.log(chalk.red("\nUncaught Exception. Exiting gracefully..."))
  process.exit(1)
})

run()
