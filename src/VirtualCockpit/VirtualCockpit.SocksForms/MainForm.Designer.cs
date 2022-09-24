namespace VirtualCockpit.SocksForms;

partial class MainForm
{
    /// <summary>
    ///  Required designer variable.
    /// </summary>
    private System.ComponentModel.IContainer components = null;

    /// <summary>
    ///  Clean up any resources being used.
    /// </summary>
    /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
    protected override void Dispose(bool disposing)
    {
        if (disposing && (components != null))
        {
            components.Dispose();
        }

        base.Dispose(disposing);
    }

    #region Windows Form Designer generated code

    /// <summary>
    ///  Required method for Designer support - do not modify
    ///  the contents of this method with the code editor.
    /// </summary>
    private void InitializeComponent()
    {
            this.outputTextbox = new System.Windows.Forms.TextBox();
            this.commandTextbox = new System.Windows.Forms.TextBox();
            this.valueTextbox = new System.Windows.Forms.TextBox();
            this.cmdSend = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // outputTextbox
            // 
            this.outputTextbox.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.outputTextbox.Location = new System.Drawing.Point(12, 42);
            this.outputTextbox.Multiline = true;
            this.outputTextbox.Name = "outputTextbox";
            this.outputTextbox.ReadOnly = true;
            this.outputTextbox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.outputTextbox.Size = new System.Drawing.Size(778, 358);
            this.outputTextbox.TabIndex = 0;
            // 
            // commandTextbox
            // 
            this.commandTextbox.Anchor = ((System.Windows.Forms.AnchorStyles)(((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.commandTextbox.Location = new System.Drawing.Point(12, 13);
            this.commandTextbox.Name = "commandTextbox";
            this.commandTextbox.Size = new System.Drawing.Size(573, 23);
            this.commandTextbox.TabIndex = 1;
            this.commandTextbox.Text = "DEBUG COMMAND";
            // 
            // valueTextbox
            // 
            this.valueTextbox.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.valueTextbox.Location = new System.Drawing.Point(591, 12);
            this.valueTextbox.Name = "valueTextbox";
            this.valueTextbox.Size = new System.Drawing.Size(118, 23);
            this.valueTextbox.TabIndex = 2;
            this.valueTextbox.Text = "50";
            // 
            // cmdSend
            // 
            this.cmdSend.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
            this.cmdSend.Location = new System.Drawing.Point(715, 12);
            this.cmdSend.Name = "cmdSend";
            this.cmdSend.Size = new System.Drawing.Size(75, 23);
            this.cmdSend.TabIndex = 3;
            this.cmdSend.Text = "Send";
            this.cmdSend.UseVisualStyleBackColor = true;
            this.cmdSend.Click += new System.EventHandler(this.cmdSend_Click);
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(802, 412);
            this.Controls.Add(this.cmdSend);
            this.Controls.Add(this.valueTextbox);
            this.Controls.Add(this.commandTextbox);
            this.Controls.Add(this.outputTextbox);
            this.Name = "MainForm";
            this.Text = "Main Form";
            this.ResumeLayout(false);
            this.PerformLayout();

    }

    #endregion

    private TextBox outputTextbox;
    private TextBox commandTextbox;
    private TextBox valueTextbox;
    private Button cmdSend;
}