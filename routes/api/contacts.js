import express from "express";
import Joi from "joi";

import {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
} from "../../models/contacts.js";

const router = express.Router();

const addContactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});

const updateContactSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
}).or("name", "email", "phone");

router.get("/", async (req, res, next) => {
  try {
    const contacts = await listContacts();
    res.json({
      status: "success",
      code: 200,
      data: { contacts },
    });
  } catch (err) {
    res.json({
      status: "Internal Server Error",
      code: 500,
      message: err?.message,
    });
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await getContactById(contactId);

    if (contact) {
      res.json({
        status: "success",
        code: 200,
        data: { contact },
      });
    } else {
      res.json({
        status: "error",
        code: 404,
        message: "Not Found",
      });
    }
  } catch (err) {
    res.json({
      status: "Internal Server Error",
      code: 500,
      message: err?.message,
    });
  }
});

router.post("/", async (req, res, next) => {
  const newContact = req.body;
  const { name, email, phone } = newContact;

  const { error } = addContactSchema.validate(newContact);

  if (error) {
    res.json({
      status: "error",
      code: 400,
      message: error.details[0].message,
    });
  } else {
    try {
      const addedContact = await addContact(newContact);

      res.status(201).json({
        status: "success",
        code: 201,
        data: { addedContact },
      });
    } catch (err) {
      res.json({
        status: "Internal Server Error",
        code: 500,
        message: err?.message,
      });
    }
  }
});

router.delete("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await removeContact(contactId);

    if (contact) {
      res.json({
        status: "success",
        code: 200,
        message: "contact deleted",
      });
    } else {
      res.json({
        status: "error",
        code: 404,
        message: "Not Found",
      });
    }
  } catch (err) {
    res.json({
      status: "Internal Server Error",
      code: 500,
      message: err?.message,
    });
  }
});

router.put("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const updatedContact = req.body;
    const contact = await getContactById(contactId);

    if (!contact) {
      res.json({
        status: "error",
        code: 404,
        message: "Not Found",
      });
    }

    const { error } = updateContactSchema.validate(updatedContact);

    if (error) {
      res.json({
        status: "error",
        code: 400,
        message: error.details[0].message,
      });
    }

    const editedContact = await updateContact(contactId, updatedContact);

    res.json({
      status: "success",
      code: 200,
      data: { editedContact },
    });
  } catch (err) {
    res.json({
      status: "Internal Server Error",
      code: 500,
      message: err?.message,
    });
  }
});

export default router;
