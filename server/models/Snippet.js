import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    command: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600
    },
    description: {
      type: String,
      trim: true,
      maxlength: 280
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    favorite: {
      type: Boolean,
      default: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Snippet = mongoose.model('Snippet', snippetSchema);
