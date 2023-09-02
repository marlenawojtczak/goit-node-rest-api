import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contactsPath = path.join(__dirname, "contacts.json");

export const listContacts = async () => {
  try {
    const contacts = await fs.readFile(contactsPath);
    const parsedContacts = JSON.parse(contacts);

    return parsedContacts;
  } catch (error) {
    console.log(error);
  }
};

export const getContactById = async (contactId) => {
  try {
    const contacts = await listContacts();
    const contact = contacts.find((el) => el.id === contactId);

    return contact;
  } catch (error) {
    console.log(error);
  }
};

export const removeContact = async (contactId) => {
  try {
    const contacts = await listContacts();
    const newContacts = contacts.filter((el) => el.id !== contactId);

    if (newContacts.length !== contacts.length) {
      await fs.writeFile(contactsPath, JSON.stringify(newContacts));
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
};

export const addContact = async (body) => {
  try {
    const contacts = await listContacts();

    const { name, email, phone } = body;

    const newContact = {
      id: uuidv4(),
      name,
      email,
      phone,
    };

    contacts.push(newContact);

    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));

    return newContact;
  } catch (error) {
    console.log(error);
  }
};

export const updateContact = async (contactId, body) => {
  try {
    const contacts = await listContacts();

    const updatedContacts = contacts.map((contact) => {
      if (contact.id === contactId) {
        return {
          ...contact,
          ...body,
        };
      }
      return contact;
    });

    await fs.writeFile(contactsPath, JSON.stringify(updatedContacts, null, 2));

    const updatedContact = updatedContacts.find(
      (contact) => contact.id === contactId
    );

    return updatedContact;
  } catch (err) {
    throw err;
  }
};
